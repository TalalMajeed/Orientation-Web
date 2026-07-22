/**
 * QR payload format. Deliberately free of "server-only" so the scanner can
 * reject foreign QR codes (posters, WiFi codes, payment apps) in the browser
 * without a network round trip or a junk row in scan_log.
 *
 * The prefix also versions the format: a future OW2 payload is distinguishable
 * from this one.
 */
export const QR_PREFIX = "OW1:";

export function toQrPayload(token: string): string {
  return `${QR_PREFIX}${token}`;
}

/** Returns the raw token, or null when this QR is not one of ours. */
export function parseQrPayload(payload: string): string | null {
  const trimmed = payload.trim();

  if (!trimmed.startsWith(QR_PREFIX)) {
    return null;
  }

  const token = trimmed.slice(QR_PREFIX.length);

  return token.length > 0 ? token : null;
}
