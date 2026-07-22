import "server-only";

import type { ObjectId } from "mongodb";
import { NextResponse, type NextRequest } from "next/server";

import { toObjectId } from "./events";

export async function readJsonBody(
  request: NextRequest
): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();

    return typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export function readString(
  body: Record<string, unknown> | null,
  key: string
): string | null {
  const value = body?.[key];

  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

export function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}

/**
 * Every ticket operation is scoped to an event, so this check appears in most
 * handlers. Returns the id or a ready-made 400.
 */
export function requireEventId(
  value: string | null
): { eventId: ObjectId } | { response: NextResponse } {
  if (!value) {
    return { response: badRequest("An event is required") };
  }

  const eventId = toObjectId(value);

  if (!eventId) {
    return { response: badRequest("Invalid event id") };
  }

  return { eventId };
}

export function isResponse(
  value: { eventId: ObjectId } | { response: NextResponse }
): value is { response: NextResponse } {
  return "response" in value;
}
