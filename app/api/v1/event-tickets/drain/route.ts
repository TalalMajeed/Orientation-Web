import { NextRequest, NextResponse } from "next/server";

import { requireRole } from "@/services/auth/guard";
import { drainOutbox } from "@/services/tickets/mail";
import {
  isResponse,
  readJsonBody,
  readString,
  requireEventId,
} from "@/services/tickets/request";
import { countUnsentTickets } from "@/services/tickets/tickets";

const DEFAULT_BATCH = 10;
const MAX_BATCH = 25;

/**
 * Sends one batch and returns. The caller paces the loop — Graph throttles
 * around 30 messages a minute, and 2000 emails is over an hour of wall clock,
 * which no serverless request will survive.
 */
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

  const requested = Number(body?.limit ?? DEFAULT_BATCH);
  const limit = Math.min(
    MAX_BATCH,
    Math.max(1, Number.isFinite(requested) ? Math.floor(requested) : DEFAULT_BATCH)
  );

  const result = await drainOutbox(event.eventId, limit);
  const remaining = await countUnsentTickets(event.eventId);

  return NextResponse.json({ ...result, remaining }, { status: 200 });
}

export async function GET(request: NextRequest) {
  const denied = requireRole(request, "admin");

  if (denied) {
    return denied;
  }

  const event = requireEventId(request.nextUrl.searchParams.get("eventId"));

  if (isResponse(event)) {
    return event.response;
  }

  return NextResponse.json(
    { remaining: await countUnsentTickets(event.eventId) },
    { status: 200 }
  );
}
