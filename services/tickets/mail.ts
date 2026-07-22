import "server-only";

import type { ObjectId } from "mongodb";
import QRCode from "qrcode";

import {
  isTransientMailError,
  sendMail,
  type MailAttachment,
} from "@/services/email/graph";
import { getEvent } from "./events";
import { toQrPayload } from "./qr";
import { formatPakistanDateTime } from "./time";
import {
  listUnsentTickets,
  markEmailFailed,
  markEmailSent,
  mintTicketToken,
} from "./tickets";
import type { EventDoc, TicketDoc } from "./types";

const QR_CONTENT_ID = "orientation-ticket-qr";

const QR_OPTIONS = {
  width: 600,
  margin: 2,
  // Medium recovery keeps the code small while surviving a scratched screen.
  errorCorrectionLevel: "M",
  color: { dark: "#000000", light: "#ffffff" },
} as const;

export async function renderQrPng(token: string): Promise<Buffer> {
  return QRCode.toBuffer(toQrPayload(token), { type: "png", ...QR_OPTIONS });
}

/** For rendering the QR on screen at issue time — never emailed as a data URI. */
export async function renderQrDataUrl(token: string): Promise<string> {
  return QRCode.toDataURL(toQrPayload(token), QR_OPTIONS);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildTicketEmailHtml(
  ticket: Pick<TicketDoc, "holderName">,
  event: Pick<EventDoc, "name" | "startsAt" | "venue">
): string {
  const name = escapeHtml(ticket.holderName);
  const eventName = escapeHtml(event.name);
  const when = event.startsAt
    ? escapeHtml(formatPakistanDateTime(event.startsAt))
    : null;
  const venue = event.venue ? escapeHtml(event.venue) : null;

  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#171717;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;">
      <h1 style="margin:0 0 8px;font-size:20px;">${eventName}</h1>
      <p style="margin:0 0 24px;font-size:15px;">Hello ${name}, here is your entry ticket.</p>

      <table style="width:100%;font-size:14px;margin-bottom:24px;">
        ${when ? `<tr><td style="padding:4px 0;color:#737373;">When</td><td style="padding:4px 0;text-align:right;">${when} PKT</td></tr>` : ""}
        ${venue ? `<tr><td style="padding:4px 0;color:#737373;">Where</td><td style="padding:4px 0;text-align:right;">${venue}</td></tr>` : ""}
      </table>

      <div style="background:#ffffff;border:1px solid #e5e5e5;border-radius:8px;padding:16px;text-align:center;">
        <img src="cid:${QR_CONTENT_ID}" alt="Your ticket QR code" width="280" height="280" style="display:block;margin:0 auto;background:#ffffff;" />
      </div>

      <p style="margin:24px 0 0;font-size:14px;">
        <strong>This ticket admits one person, one time.</strong> Do not share or
        forward it — whoever presents it first will be let in, and you will be
        turned away at the gate.
      </p>
      <p style="margin:12px 0 0;font-size:14px;">
        Please bring your student ID or admission letter so staff can check the
        name against this ticket.
      </p>
      <p style="margin:24px 0 0;font-size:12px;color:#737373;">
        If the code above does not appear, the same image is attached to this email.
      </p>
    </div>
  </body>
</html>`;
}

export async function sendTicketEmail(
  ticket: Pick<TicketDoc, "holderName" | "email">,
  event: Pick<EventDoc, "name" | "startsAt" | "venue">,
  token: string
): Promise<void> {
  const png = await renderQrPng(token);
  const contentBytes = png.toString("base64");

  // Sent twice on purpose: inline for clients that render CID images, and as a
  // plain attachment for the ones that block them.
  const attachments: MailAttachment[] = [
    {
      name: "ticket-qr.png",
      contentType: "image/png",
      contentBytes,
      contentId: QR_CONTENT_ID,
      isInline: true,
    },
    {
      name: "orientation-ticket.png",
      contentType: "image/png",
      contentBytes,
    },
  ];

  await sendMail({
    to: ticket.email,
    subject: `${event.name} — your entry ticket`,
    body: buildTicketEmailHtml(ticket, event),
    contentType: "HTML",
    attachments,
  });
}

export interface DrainOutcome {
  ticketId: string;
  email: string;
  status: "sent" | "failed";
  error?: string;
}

export interface DrainResult {
  attempted: number;
  sent: number;
  failed: number;
  outcomes: DrainOutcome[];
}

/**
 * Sends the next batch of unsent tickets and returns. Deliberately does NOT
 * sleep between sends: pacing against Graph's ~30/min throttle belongs to the
 * caller, which can wait between drain calls without holding a request open
 * for the hour that 2000 emails would take.
 */
export async function drainOutbox(
  eventId: ObjectId,
  limit = 10
): Promise<DrainResult> {
  const event = await getEvent(eventId);

  if (!event) {
    throw new Error("No such event");
  }

  const pending = await listUnsentTickets(eventId, limit);
  const outcomes: DrainOutcome[] = [];

  for (const ticket of pending) {
    const ticketId = ticket._id.toHexString();

    try {
      // Minting and sending are the same step: the raw token is not stored, so
      // whoever mints it is the only one who can deliver it.
      const { token } = await mintTicketToken(ticket._id);

      await sendTicketEmail(ticket, event, token);
      await markEmailSent(ticket._id);

      outcomes.push({ ticketId, email: ticket.email, status: "sent" });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown send failure";

      // Throttling is not the ticket's fault, so it must not burn a retry.
      if (isTransientMailError(error)) {
        outcomes.push({
          ticketId,
          email: ticket.email,
          status: "failed",
          error: "Throttled by the mail provider — will retry",
        });
        break;
      }

      await markEmailFailed(ticket._id, message);
      outcomes.push({
        ticketId,
        email: ticket.email,
        status: "failed",
        error: message,
      });
    }
  }

  return {
    attempted: outcomes.length,
    sent: outcomes.filter((outcome) => outcome.status === "sent").length,
    failed: outcomes.filter((outcome) => outcome.status === "failed").length,
    outcomes,
  };
}
