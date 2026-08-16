import "server-only";

import { sendMail } from "@/services/email/graph";

export const SUPPORT_INBOX = "support@orientation.nust.edu.pk";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME = 120;
const MAX_EMAIL = 200;
const MIN_MESSAGE = 10;
const MAX_MESSAGE = 4000;

export class ContactValidationError extends Error {}

export interface ContactMessage {
  name: string;
  email: string;
  message: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toHeaderSafe(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function assertValidContactMessage(input: ContactMessage): ContactMessage {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const message = input.message.trim();

  if (!name || name.length > MAX_NAME) {
    throw new ContactValidationError(`A name of up to ${MAX_NAME} characters is required`);
  }

  if (!EMAIL_PATTERN.test(email) || email.length > MAX_EMAIL) {
    throw new ContactValidationError("A valid email address is required");
  }

  if (message.length < MIN_MESSAGE) {
    throw new ContactValidationError(
      `Please write at least ${MIN_MESSAGE} characters so the team can help`
    );
  }

  if (message.length > MAX_MESSAGE) {
    throw new ContactValidationError(
      `Please keep the message under ${MAX_MESSAGE} characters`
    );
  }

  return { name, email, message };
}

export function buildContactEmailHtml({ name, email, message }: ContactMessage): string {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br />");

  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#171717;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;">
      <p style="margin:0 0 4px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#737373;">
        orientation.nust.edu.pk — contact form
      </p>
      <h1 style="margin:0 0 24px;font-size:20px;">Message from ${safeName}</h1>

      <table style="width:100%;font-size:14px;margin-bottom:24px;">
        <tr>
          <td style="padding:4px 0;color:#737373;">From</td>
          <td style="padding:4px 0;text-align:right;">${safeName}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#737373;">Email</td>
          <td style="padding:4px 0;text-align:right;">
            <a href="mailto:${safeEmail}" style="color:#171717;">${safeEmail}</a>
          </td>
        </tr>
      </table>

      <div style="border-left:3px solid #e5e5e5;padding:4px 0 4px 16px;font-size:15px;line-height:1.5;">
        ${safeMessage}
      </div>

      <p style="margin:24px 0 0;font-size:12px;color:#737373;">
        Reply directly to this email to reach ${safeEmail}.
      </p>
    </div>
  </body>
</html>`;
}

export async function sendContactMessage(input: ContactMessage): Promise<void> {
  const valid = assertValidContactMessage(input);

  await sendMail({
    to: SUPPORT_INBOX,
    replyTo: valid.email,
    subject: `Contact form — ${toHeaderSafe(valid.name)}`,
    body: buildContactEmailHtml(valid),
  });
}
