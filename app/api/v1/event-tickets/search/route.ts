import { NextRequest, NextResponse } from "next/server";

import { requireRole } from "@/services/auth/guard";
import {
  badRequest,
  isResponse,
  requireEventId,
} from "@/services/tickets/request";
import { listTickets } from "@/services/tickets/tickets";

const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS = 20;

/**
 * Gate lookup for manual check-in. Reachable by scanners, so it is deliberately
 * narrow: a minimum query length and a hard result cap keep it from being used
 * to page through the whole attendee list.
 */
export async function GET(request: NextRequest) {
  const denied = requireRole(request, "scanner", "admin");

  if (denied) {
    return denied;
  }

  const params = request.nextUrl.searchParams;
  const event = requireEventId(params.get("eventId"));

  if (isResponse(event)) {
    return event.response;
  }

  const query = (params.get("q") ?? "").trim();

  if (query.length < MIN_QUERY_LENGTH) {
    return badRequest(`Type at least ${MIN_QUERY_LENGTH} characters`);
  }

  const { tickets } = await listTickets({
    eventId: event.eventId,
    search: query,
    pageSize: MAX_RESULTS,
  });

  return NextResponse.json(
    {
      tickets: tickets.map((ticket) => ({
        id: ticket.id,
        holderName: ticket.holderName,
        email: ticket.email,
        status: ticket.status,
        usedAt: ticket.usedAt,
        usedGate: ticket.usedGate,
      })),
    },
    { status: 200 }
  );
}
