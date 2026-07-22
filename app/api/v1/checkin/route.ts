import { NextRequest, NextResponse } from "next/server";

import { requireRole } from "@/services/auth/guard";
import { parseQrPayload } from "@/services/tickets/qr";
import {
  badRequest,
  isResponse,
  readJsonBody,
  readString,
  requireEventId,
} from "@/services/tickets/request";
import { checkInByToken } from "@/services/tickets/tickets";

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

  const payload = readString(body, "token");

  if (!payload) {
    return badRequest("A token is required");
  }

  // Accept either the raw token or the full QR payload, so a client that
  // forgets to strip the prefix still works.
  const token = parseQrPayload(payload) ?? payload;
  const gate = readString(body, "gate") ?? "unknown";

  const result = await checkInByToken(token, { eventId: event.eventId, gate });

  return NextResponse.json(result, { status: 200 });
}
