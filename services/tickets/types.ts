import type { ObjectId } from "mongodb";

export type TicketStatus = "issued" | "used" | "revoked";

export type CheckInResult =
  | "valid"
  | "already_used"
  | "revoked"
  | "not_found"
  | "wrong_event";

export type CheckInVia = "scan" | "manual";

/**
 * Where a ticket stands with its email, derived from emailSentAt / emailError /
 * emailAttempts. Computed server-side because the retry cap lives in
 * `tickets.ts`, which is server-only and so cannot be read by the browser.
 *
 * `undeliverable` is the one that never resolves itself: the drain has given up
 * and this person will arrive at the gate with no ticket unless someone acts.
 */
export type DeliveryState = "sent" | "queued" | "retrying" | "undeliverable";

export interface EventDoc {
  _id: ObjectId;
  name: string;
  startsAt: Date | null;
  venue: string | null;
  createdAt: Date;
}

export interface TicketDoc {
  _id: ObjectId;
  eventId: ObjectId;
  holderName: string;
  /** Always normalised: trimmed and lowercased. The dedupe key. */
  email: string;
  /**
   * `${eventId}:${email}` while the ticket is live, absent once revoked.
   * A unique partial index on this field is what makes "one live ticket per
   * person per event" a database guarantee. Revoke MUST $unset it.
   */
  activeKey?: string;
  /**
   * sha256 of every token ever issued for this ticket. Resend appends.
   * ABSENT (never `[]`) until the first token is minted — bulk-imported rows
   * have no token until the drain mints one at send time, because the raw
   * token is never stored and so cannot be recovered later.
   */
  tokenHashes?: string[];
  status: TicketStatus;
  issuedAt: Date;
  emailSentAt: Date | null;
  emailError: string | null;
  /** Bounds the token array: a failed send mints a fresh token on retry. */
  emailAttempts: number;
  /**
   * The send lease. Set while a drain holds this row, cleared when it finishes
   * with it. Two concurrent drains would otherwise both read the same pending
   * rows and email the same person twice, because minting appends to
   * `tokenHashes` rather than replacing it.
   *
   * A lease older than SEND_LEASE_MS is reclaimable — a drain that crashed
   * mid-batch must not strand its rows forever. Absent on rows written before
   * the lease existed, which Mongo matches as null.
   */
  sendingSince?: Date | null;
  usedAt: Date | null;
  usedGate: string | null;
  usedVia: CheckInVia | null;
  revokedAt: Date | null;
}

export interface ScanLogDoc {
  _id: ObjectId;
  eventId: ObjectId | null;
  ticketId: ObjectId | null;
  result: CheckInResult;
  via: CheckInVia;
  gate: string;
  scannedAt: Date;
}

/** Serialisable shapes for the browser. Never carries a raw token. */
export interface EventDto {
  id: string;
  name: string;
  startsAt: string | null;
  venue: string | null;
}

export interface TicketDto {
  id: string;
  eventId: string;
  holderName: string;
  email: string;
  status: TicketStatus;
  issuedAt: string;
  emailSentAt: string | null;
  emailError: string | null;
  emailAttempts: number;
  delivery: DeliveryState;
  usedAt: string | null;
  usedGate: string | null;
  usedVia: CheckInVia | null;
}

export interface CheckInResponse {
  result: CheckInResult;
  holderName: string | null;
  email: string | null;
  usedAt: string | null;
  usedGate: string | null;
  checkedInCount: number;
}
