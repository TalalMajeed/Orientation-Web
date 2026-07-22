import { NextRequest, NextResponse } from "next/server";

import { requireRole } from "@/services/auth/guard";
import { createEvent, listEvents } from "@/services/tickets/events";
import { badRequest, readJsonBody, readString } from "@/services/tickets/request";

/** Scanners need this to choose their gate's event at setup. */
export async function GET(request: NextRequest) {
  const denied = requireRole(request, "admin", "scanner");

  if (denied) {
    return denied;
  }

  return NextResponse.json({ events: await listEvents() }, { status: 200 });
}

export async function POST(request: NextRequest) {
  const denied = requireRole(request, "admin");

  if (denied) {
    return denied;
  }

  const body = await readJsonBody(request);
  const name = readString(body, "name");

  if (!name) {
    return badRequest("An event name is required");
  }

  const rawStartsAt = readString(body, "startsAt");
  let startsAt: Date | null = null;

  if (rawStartsAt) {
    startsAt = new Date(rawStartsAt);

    if (Number.isNaN(startsAt.getTime())) {
      return badRequest("Invalid start time");
    }
  }

  const event = await createEvent({
    name,
    startsAt,
    venue: readString(body, "venue"),
  });

  return NextResponse.json({ event }, { status: 201 });
}
