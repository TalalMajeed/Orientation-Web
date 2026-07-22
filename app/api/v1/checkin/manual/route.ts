import { NextRequest, NextResponse } from "next/server";

import { requireRole } from "@/services/auth/guard";
import { toObjectId } from "@/services/tickets/events";
import {
  badRequest,
  isResponse,
  readJsonBody,
  readString,
  requireEventId,
} from "@/services/tickets/request";
import { checkInById } from "@/services/tickets/tickets";

/**
 * Gate fallback for a dead phone or an unreadable QR. Runs the same conditional
 * update as a scan, so it cannot double-admit either.
 */
export async function POST(request: NextRequest) {
  const denied = requireRole(request, "scanner", "admin");

  if (denied) {
    return denied;
  }

  const body = await readJsonBody(request);
  const event = requireEventId(readString(body, "eventId"));

  if (isResponse(event)) {
    return event.response;
  }

  const rawTicketId = readString(body, "ticketId");
  const ticketId = rawTicketId ? toObjectId(rawTicketId) : null;

  if (!ticketId) {
    return badRequest("A valid ticket id is required");
  }

  const gate = readString(body, "gate") ?? "unknown";
  const result = await checkInById(ticketId, { eventId: event.eventId, gate });

  return NextResponse.json(result, { status: 200 });
}
