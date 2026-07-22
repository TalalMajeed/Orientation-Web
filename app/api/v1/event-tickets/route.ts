import { NextRequest, NextResponse } from "next/server";

import { requireRole } from "@/services/auth/guard";
import { getEvent, toObjectId } from "@/services/tickets/events";
import { renderQrDataUrl, sendTicketEmail } from "@/services/tickets/mail";
import {
  badRequest,
  isResponse,
  readJsonBody,
  readString,
  requireEventId,
} from "@/services/tickets/request";
import {
  DuplicateTicketError,
  getTicketStats,
  issueTicket,
  listTickets,
  markEmailFailed,
  markEmailSent,
} from "@/services/tickets/tickets";
import type { TicketStatus } from "@/services/tickets/types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STATUSES: TicketStatus[] = ["issued", "used", "revoked"];

function readStatus(value: string | null): TicketStatus | undefined {
  return STATUSES.includes(value as TicketStatus)
    ? (value as TicketStatus)
    : undefined;
}

export async function GET(request: NextRequest) {
  const denied = requireRole(request, "admin");

  if (denied) {
    return denied;
  }

  const params = request.nextUrl.searchParams;
  const event = requireEventId(params.get("eventId"));

  if (isResponse(event)) {
    return event.response;
  }

  const [result, stats] = await Promise.all([
    listTickets({
      eventId: event.eventId,
      search: params.get("search") ?? undefined,
      status: readStatus(params.get("status")),
      page: Number(params.get("page") ?? 1),
    }),
    getTicketStats(event.eventId),
  ]);

  return NextResponse.json({ ...result, stats }, { status: 200 });
}

export async function POST(request: NextRequest) {
  const denied = requireRole(request, "admin");

  if (denied) {
    return denied;
  }

  const body = await readJsonBody(request);
  const event = requireEventId(readString(body, "eventId"));

  if (isResponse(event)) {
    return event.response;
  }

  const holderName = readString(body, "holderName");
  const email = readString(body, "email");

  if (!holderName) {
    return badRequest("A full name is required");
  }

  if (!email || !EMAIL_PATTERN.test(email)) {
    return badRequest("A valid email address is required");
  }

  const eventDoc = await getEvent(event.eventId);

  if (!eventDoc) {
    return badRequest("No such event");
  }

  let ticket;
  let token;

  try {
    ({ ticket, token } = await issueTicket({
      eventId: event.eventId,
      holderName,
      email,
    }));
  } catch (error) {
    if (error instanceof DuplicateTicketError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    throw error;
  }

  if (!token) {
    throw new Error("issueTicket did not mint a token");
  }

  const ticketId = toObjectId(ticket.id);

  if (!ticketId) {
    throw new Error("Ticket id was not a valid ObjectId");
  }

  // The QR image necessarily encodes the token — that is what a ticket is. The
  // token is never returned as a field, logged, or stored.
  const qrDataUrl = await renderQrDataUrl(token);

  let emailError: string | null = null;

  // A single email fits comfortably in one request; only bulk needs the queue.
  if (body?.sendEmail !== false) {
    try {
      await sendTicketEmail({ holderName, email }, eventDoc, token);
      await markEmailSent(ticketId);
    } catch (error) {
      emailError =
        error instanceof Error ? error.message : "Unknown send failure";
      await markEmailFailed(ticketId, emailError);
    }
  }

  return NextResponse.json({ ticket, qrDataUrl, emailError }, { status: 201 });
}
