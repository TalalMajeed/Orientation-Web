import { NextRequest, NextResponse } from "next/server";

import { requireRole } from "@/services/auth/guard";
import { toObjectId } from "@/services/tickets/events";
import { badRequest } from "@/services/tickets/request";
import {
  TicketNotFoundError,
  TicketNotIssuedError,
  requeueTicketEmail,
  revokeTicket,
} from "@/services/tickets/tickets";

type RouteContext = { params: Promise<{ id: string }> };

function handleLifecycleError(error: unknown): NextResponse {
  if (error instanceof TicketNotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  if (error instanceof TicketNotIssuedError) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }

  throw error;
}

/** Revoke. Frees the holder to be issued a fresh ticket for this event. */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const denied = requireRole(request, "admin");

  if (denied) {
    return denied;
  }

  const ticketId = toObjectId((await params).id);

  if (!ticketId) {
    return badRequest("Invalid ticket id");
  }

  try {
    return NextResponse.json(
      { ticket: await revokeTicket(ticketId) },
      { status: 200 }
    );
  } catch (error) {
    return handleLifecycleError(error);
  }
}

/**
 * Resend. Only clears the send cursor — the drain mints the new token, since
 * whoever mints one has to be the one that delivers it. Every QR already sent
 * keeps working.
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  const denied = requireRole(request, "admin");

  if (denied) {
    return denied;
  }

  const ticketId = toObjectId((await params).id);

  if (!ticketId) {
    return badRequest("Invalid ticket id");
  }

  try {
    return NextResponse.json(
      { ticket: await requeueTicketEmail(ticketId) },
      { status: 200 }
    );
  } catch (error) {
    return handleLifecycleError(error);
  }
}
