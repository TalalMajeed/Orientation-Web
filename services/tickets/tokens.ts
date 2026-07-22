import "server-only";

import { createHash, randomBytes } from "crypto";

const TOKEN_BYTES = 32;

/**
 * The raw token exists in memory, in the QR image, and in the email. It is
 * never stored, never logged, and never returned to the browser.
 */
export function generateToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
