import "server-only";

import { ObjectId } from "mongodb";

import {
  ensureIndexes,
  scanLogCollection,
  ticketsCollection,
} from "./db";
import { generateToken, hashToken } from "./tokens";
import type {
  CheckInResponse,
  CheckInResult,
  CheckInVia,
  TicketDoc,
  TicketDto,
  TicketStatus,
} from "./types";

export class DuplicateTicketError extends Error {}
export class TicketNotFoundError extends Error {}
export class TicketNotIssuedError extends Error {}

/**
 * The dedupe key. Normalising before indexing is what stops "Ali@nust.edu.pk"
 * and "ali@nust.edu.pk " from both inserting. We deliberately do NOT strip
 * Gmail dots or +tags — that would merge distinct mailboxes on other providers.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function activeKeyFor(eventId: ObjectId, email: string): string {
  return `${eventId.toHexString()}:${email}`;
}

function isDuplicateKeyError(error: unknown): error is {
  code: number;
  keyPattern?: Record<string, unknown>;
} {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === 11000
  );
}

export function toTicketDto(doc: TicketDoc): TicketDto {
  return {
    id: doc._id.toHexString(),
    eventId: doc.eventId.toHexString(),
    holderName: doc.holderName,
    email: doc.email,
    status: doc.status,
    issuedAt: doc.issuedAt.toISOString(),
    emailSentAt: doc.emailSentAt ? doc.emailSentAt.toISOString() : null,
    emailError: doc.emailError,
    emailAttempts: doc.emailAttempts ?? 0,
    usedAt: doc.usedAt ? doc.usedAt.toISOString() : null,
    usedGate: doc.usedGate,
    usedVia: doc.usedVia,
  };
}

// ---------------------------------------------------------------- issuing

export interface IssueTicketInput {
  eventId: ObjectId;
  holderName: string;
  email: string;
  /**
   * Bulk import defers minting to the drain. The raw token is never stored, so
   * it cannot be recovered later — whoever mints it must also send it.
   */
  mintToken?: boolean;
}

export interface IssuedTicket {
  ticket: TicketDto;
  /** Raw token. Goes straight into a QR image and is then discarded. */
  token: string | null;
}

export async function issueTicket({
  eventId,
  holderName,
  email,
  mintToken = true,
}: IssueTicketInput): Promise<IssuedTicket> {
  await ensureIndexes();

  const tickets = await ticketsCollection();
  const normalizedEmail = normalizeEmail(email);
  const now = new Date();

  // A tokenHashes collision needs a 256-bit hash collision or a repeated
  // 32-byte random draw. Retrying once costs nothing and removes the case.
  for (let attempt = 0; attempt < 2; attempt++) {
    const token = mintToken ? generateToken() : null;
    const doc: TicketDoc = {
      _id: new ObjectId(),
      eventId,
      holderName: holderName.trim(),
      email: normalizedEmail,
      activeKey: activeKeyFor(eventId, normalizedEmail),
      // Omitted entirely rather than set to [], which would index as a single
      // null key and collide with every other token-less row.
      ...(token ? { tokenHashes: [hashToken(token)] } : {}),
      status: "issued",
      issuedAt: now,
      emailSentAt: null,
      emailError: null,
      emailAttempts: 0,
      usedAt: null,
      usedGate: null,
      usedVia: null,
      revokedAt: null,
    };

    try {
      await tickets.insertOne(doc);

      return { ticket: toTicketDto(doc), token };
    } catch (error) {
      if (!isDuplicateKeyError(error)) {
        throw error;
      }

      if (error.keyPattern && "activeKey" in error.keyPattern) {
        throw new DuplicateTicketError(
          "This person already has a live ticket for this event"
        );
      }
      // Otherwise it was tokenHashes: fall through and draw a new token.
    }
  }

  throw new Error("Failed to generate a unique ticket token");
}

// ---------------------------------------------------------------- check-in

async function checkedInCount(eventId: ObjectId): Promise<number> {
  const tickets = await ticketsCollection();

  return tickets.countDocuments({ eventId, status: "used" });
}

async function recordScan({
  eventId,
  ticketId,
  result,
  via,
  gate,
}: {
  eventId: ObjectId;
  ticketId: ObjectId | null;
  result: CheckInResult;
  via: CheckInVia;
  gate: string;
}): Promise<void> {
  const scanLog = await scanLogCollection();

  await scanLog.insertOne({
    _id: new ObjectId(),
    eventId,
    ticketId,
    result,
    via,
    gate,
    scannedAt: new Date(),
  });
}

/**
 * Classifies a check-in that the conditional update did not win.
 * A ticket that still reads "issued" here means a concurrent scan took it
 * between the two queries — which is an already-used outcome, not a miss.
 */
function classify(existing: TicketDoc | null, eventId: ObjectId): CheckInResult {
  if (!existing) {
    return "not_found";
  }

  if (!existing.eventId.equals(eventId)) {
    return "wrong_event";
  }

  if (existing.status === "revoked") {
    return "revoked";
  }

  return "already_used";
}

async function respond(
  eventId: ObjectId,
  result: CheckInResult,
  ticket: TicketDoc | null,
  via: CheckInVia,
  gate: string
): Promise<CheckInResponse> {
  await recordScan({
    eventId,
    ticketId: ticket ? ticket._id : null,
    result,
    via,
    gate,
  });

  return {
    result,
    holderName: ticket ? ticket.holderName : null,
    email: ticket ? ticket.email : null,
    usedAt: ticket?.usedAt ? ticket.usedAt.toISOString() : null,
    usedGate: ticket ? ticket.usedGate : null,
    checkedInCount: await checkedInCount(eventId),
  };
}

export interface CheckInInput {
  eventId: ObjectId;
  gate: string;
}

/**
 * THE CORE RULE. One conditional update, no read-then-write. Mongo guarantees
 * that of N concurrent callers matching { status: "issued" }, exactly one
 * document update succeeds — so exactly one caller is told to admit.
 */
export async function checkInByToken(
  token: string,
  { eventId, gate }: CheckInInput
): Promise<CheckInResponse> {
  await ensureIndexes();

  const tickets = await ticketsCollection();
  const hash = hashToken(token);

  const admitted = await tickets.findOneAndUpdate(
    { tokenHashes: hash, eventId, status: "issued" },
    {
      $set: {
        status: "used" as TicketStatus,
        usedAt: new Date(),
        usedGate: gate,
        usedVia: "scan" as CheckInVia,
      },
    },
    { returnDocument: "after" }
  );

  if (admitted) {
    return respond(eventId, "valid", admitted, "scan", gate);
  }

  const existing = await tickets.findOne({ tokenHashes: hash });

  return respond(eventId, classify(existing, eventId), existing, "scan", gate);
}

/**
 * Gate fallback for a dead phone or a QR that will not scan. Runs the identical
 * conditional update keyed on _id, so it cannot double-admit either.
 */
export async function checkInById(
  ticketId: ObjectId,
  { eventId, gate }: CheckInInput
): Promise<CheckInResponse> {
  await ensureIndexes();

  const tickets = await ticketsCollection();

  const admitted = await tickets.findOneAndUpdate(
    { _id: ticketId, eventId, status: "issued" },
    {
      $set: {
        status: "used" as TicketStatus,
        usedAt: new Date(),
        usedGate: gate,
        usedVia: "manual" as CheckInVia,
      },
    },
    { returnDocument: "after" }
  );

  if (admitted) {
    return respond(eventId, "valid", admitted, "manual", gate);
  }

  const existing = await tickets.findOne({ _id: ticketId });

  return respond(eventId, classify(existing, eventId), existing, "manual", gate);
}

// ---------------------------------------------------------------- lifecycle

export async function revokeTicket(ticketId: ObjectId): Promise<TicketDto> {
  await ensureIndexes();

  const tickets = await ticketsCollection();

  const revoked = await tickets.findOneAndUpdate(
    { _id: ticketId, status: "issued" },
    {
      $set: { status: "revoked" as TicketStatus, revokedAt: new Date() },
      // Frees the person to be issued a fresh ticket for this event.
      $unset: { activeKey: "" },
    },
    { returnDocument: "after" }
  );

  if (revoked) {
    return toTicketDto(revoked);
  }

  const existing = await tickets.findOne({ _id: ticketId });

  if (!existing) {
    throw new TicketNotFoundError("No such ticket");
  }

  throw new TicketNotIssuedError(
    existing.status === "used"
      ? "This ticket has already been used"
      : "This ticket is already revoked"
  );
}

/**
 * Appends a new token rather than rotating. Every previously emailed QR keeps
 * working, so there is no window in which a failed send leaves the holder with
 * a dead ticket and no replacement — and single-use is still enforced by
 * `status`, not by the token.
 *
 * Only the sender calls this: whoever mints a token must also deliver it,
 * because the raw value is gone the moment this returns.
 */
export async function mintTicketToken(ticketId: ObjectId): Promise<{
  ticket: TicketDto;
  token: string;
}> {
  await ensureIndexes();

  const tickets = await ticketsCollection();
  const token = generateToken();

  const updated = await tickets.findOneAndUpdate(
    { _id: ticketId, status: "issued" },
    { $push: { tokenHashes: hashToken(token) } },
    { returnDocument: "after" }
  );

  if (!updated) {
    const existing = await tickets.findOne({ _id: ticketId });

    if (!existing) {
      throw new TicketNotFoundError("No such ticket");
    }

    throw new TicketNotIssuedError(`Cannot issue a token for a ${existing.status} ticket`);
  }

  return { ticket: toTicketDto(updated), token };
}

// ---------------------------------------------------------------- outbox

/**
 * A failed send mints a fresh token on the next attempt, so retries have to be
 * bounded or the token array grows without limit.
 */
export const MAX_EMAIL_ATTEMPTS = 5;

/**
 * The resend button. Clears the cursor so the drain picks this ticket up and
 * mints it a new token; the old QR keeps working either way.
 */
export async function requeueTicketEmail(ticketId: ObjectId): Promise<TicketDto> {
  await ensureIndexes();

  const tickets = await ticketsCollection();

  const updated = await tickets.findOneAndUpdate(
    { _id: ticketId, status: "issued" },
    { $set: { emailSentAt: null, emailError: null, emailAttempts: 0 } },
    { returnDocument: "after" }
  );

  if (!updated) {
    const existing = await tickets.findOne({ _id: ticketId });

    if (!existing) {
      throw new TicketNotFoundError("No such ticket");
    }

    throw new TicketNotIssuedError(`Cannot resend a ${existing.status} ticket`);
  }

  return toTicketDto(updated);
}

/** emailSentAt IS the cursor, so a crashed or timed-out drain resumes here. */
export async function listUnsentTickets(
  eventId: ObjectId,
  limit: number
): Promise<TicketDoc[]> {
  await ensureIndexes();

  const tickets = await ticketsCollection();

  return tickets
    .find({
      eventId,
      status: "issued",
      emailSentAt: null,
      emailAttempts: { $lt: MAX_EMAIL_ATTEMPTS },
    })
    .sort({ issuedAt: 1 })
    .limit(limit)
    .toArray();
}

export async function countUnsentTickets(eventId: ObjectId): Promise<number> {
  const tickets = await ticketsCollection();

  return tickets.countDocuments({
    eventId,
    status: "issued",
    emailSentAt: null,
    emailAttempts: { $lt: MAX_EMAIL_ATTEMPTS },
  });
}

export async function markEmailSent(ticketId: ObjectId): Promise<void> {
  const tickets = await ticketsCollection();

  await tickets.updateOne(
    { _id: ticketId },
    {
      $set: { emailSentAt: new Date(), emailError: null },
      $inc: { emailAttempts: 1 },
    }
  );
}

export async function markEmailFailed(
  ticketId: ObjectId,
  message: string
): Promise<void> {
  const tickets = await ticketsCollection();

  await tickets.updateOne(
    { _id: ticketId },
    { $set: { emailError: message.slice(0, 500) }, $inc: { emailAttempts: 1 } }
  );
}

export async function findTicketById(
  ticketId: ObjectId
): Promise<TicketDoc | null> {
  const tickets = await ticketsCollection();

  return tickets.findOne({ _id: ticketId });
}

// ---------------------------------------------------------------- reading

export interface ListTicketsInput {
  eventId: ObjectId;
  search?: string;
  status?: TicketStatus;
  page?: number;
  pageSize?: number;
}

export interface ListTicketsResult {
  tickets: TicketDto[];
  total: number;
  page: number;
  pageSize: number;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function listTickets({
  eventId,
  search,
  status,
  page = 1,
  pageSize = 50,
}: ListTicketsInput): Promise<ListTicketsResult> {
  await ensureIndexes();

  const tickets = await ticketsCollection();
  const filter: Record<string, unknown> = { eventId };

  if (status) {
    filter.status = status;
  }

  const trimmedSearch = search?.trim();

  if (trimmedSearch) {
    const pattern = new RegExp(escapeRegex(trimmedSearch), "i");
    filter.$or = [{ holderName: pattern }, { email: pattern }];
  }

  const safePage = Math.max(1, Math.floor(page));
  const safePageSize = Math.min(200, Math.max(1, Math.floor(pageSize)));

  const [docs, total] = await Promise.all([
    tickets
      .find(filter)
      .sort({ issuedAt: -1 })
      .skip((safePage - 1) * safePageSize)
      .limit(safePageSize)
      .toArray(),
    tickets.countDocuments(filter),
  ]);

  return {
    tickets: docs.map(toTicketDto),
    total,
    page: safePage,
    pageSize: safePageSize,
  };
}

export interface TicketStats {
  total: number;
  issued: number;
  used: number;
  revoked: number;
}

export async function getTicketStats(eventId: ObjectId): Promise<TicketStats> {
  await ensureIndexes();

  const tickets = await ticketsCollection();
  const rows = await tickets
    .aggregate<{ _id: TicketStatus; count: number }>([
      { $match: { eventId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ])
    .toArray();

  const stats: TicketStats = { total: 0, issued: 0, used: 0, revoked: 0 };

  for (const row of rows) {
    stats[row._id] = row.count;
    stats.total += row.count;
  }

  return stats;
}
