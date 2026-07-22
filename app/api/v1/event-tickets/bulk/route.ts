import { NextRequest, NextResponse } from "next/server";

import { requireRole } from "@/services/auth/guard";
import { parseRosterCsv } from "@/services/tickets/csv";
import { getEvent } from "@/services/tickets/events";
import {
  badRequest,
  isResponse,
  readJsonBody,
  readString,
  requireEventId,
} from "@/services/tickets/request";
import { DuplicateTicketError, issueTicket } from "@/services/tickets/tickets";

const MAX_ROWS = 5000;

export interface BulkOutcome {
  line: number;
  name?: string;
  email: string;
  status: "queued" | "failed";
  reason?: string;
}

/**
 * Inserts rows only — no sending. Tickets are created WITHOUT a token; the
 * drain mints one at send time, because the raw token is never stored and so
 * could not be recovered later. Insert-only keeps this inside one request even
 * for a few thousand rows.
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

  const csv = typeof body?.csv === "string" ? body.csv : null;

  if (!csv) {
    return badRequest("A CSV body is required");
  }

  if (!(await getEvent(event.eventId))) {
    return badRequest("No such event");
  }

  const { rows, problems } = parseRosterCsv(csv);

  if (rows.length === 0 && problems.length > 0) {
    return NextResponse.json(
      { error: problems[0].message, outcomes: [] },
      { status: 400 }
    );
  }

  if (rows.length > MAX_ROWS) {
    return badRequest(`Too many rows — the limit is ${MAX_ROWS}`);
  }

  const outcomes: BulkOutcome[] = problems.map((problem) => ({
    line: problem.line,
    email: "",
    status: "failed",
    reason: problem.message,
  }));

  for (const row of rows) {
    try {
      await issueTicket({
        eventId: event.eventId,
        holderName: row.name,
        email: row.email,
        mintToken: false,
      });

      outcomes.push({
        line: row.line,
        name: row.name,
        email: row.email,
        status: "queued",
      });
    } catch (error) {
      outcomes.push({
        line: row.line,
        name: row.name,
        email: row.email,
        status: "failed",
        reason:
          error instanceof DuplicateTicketError
            ? "Already has a live ticket for this event"
            : "Could not be created",
      });
    }
  }

  outcomes.sort((a, b) => a.line - b.line);

  return NextResponse.json(
    {
      queued: outcomes.filter((outcome) => outcome.status === "queued").length,
      failed: outcomes.filter((outcome) => outcome.status === "failed").length,
      outcomes,
    },
    { status: 200 }
  );
}
