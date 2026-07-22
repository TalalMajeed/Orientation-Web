import { NextRequest } from "next/server";

import { requireRole } from "@/services/auth/guard";
import { toCsv } from "@/services/tickets/csv";
import { getEvent } from "@/services/tickets/events";
import { isResponse, requireEventId } from "@/services/tickets/request";
import { formatPakistanDateTime } from "@/services/tickets/time";
import { listTickets } from "@/services/tickets/tickets";

const PAGE_SIZE = 200;

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "event"
  );
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

  const eventDoc = await getEvent(event.eventId);

  if (!eventDoc) {
    return new Response("No such event", { status: 400 });
  }

  const rows: string[][] = [];

  // Paged so a few thousand tickets do not all land in memory at once.
  for (let page = 1; ; page++) {
    const { tickets, total } = await listTickets({
      eventId: event.eventId,
      page,
      pageSize: PAGE_SIZE,
    });

    for (const ticket of tickets) {
      rows.push([
        ticket.holderName,
        ticket.email,
        ticket.status,
        formatPakistanDateTime(ticket.issuedAt),
        formatPakistanDateTime(ticket.emailSentAt),
        formatPakistanDateTime(ticket.usedAt),
        ticket.usedGate ?? "",
        ticket.usedVia ?? "",
      ]);
    }

    if (tickets.length === 0 || rows.length >= total) {
      break;
    }
  }

  const csv = toCsv(
    [
      "Name",
      "Email",
      "Status",
      "Issued (PKT)",
      "Emailed (PKT)",
      "Checked in (PKT)",
      "Gate",
      "Via",
    ],
    rows
  );

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slugify(eventDoc.name)}-tickets.csv"`,
    },
  });
}
