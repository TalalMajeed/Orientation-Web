const CARTO_TILES = "https://*.basemaps.cartocdn.com";

// React's dev build uses eval() for things like cross-environment stack traces,
// so the dev server needs 'unsafe-eval'. Production never gets it.
const SCRIPT_SRC =
  process.env.NODE_ENV === "production"
    ? "script-src 'self' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";

const CSP_DIRECTIVES = [
  "default-src 'self'",
  SCRIPT_SRC,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https: ${CARTO_TILES}`,
  "font-src 'self' data:",
  "media-src 'self'",
  `connect-src 'self' ${CARTO_TILES}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "frame-src 'self'",
];

export const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-DNS-Prefetch-Control": "off",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Permissions-Policy": [
    "camera=()",
    "microphone=()",
    "geolocation=()",
    "payment=()",
    "usb=()",
    "interest-cohort=()",
  ].join(", "),
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
};

export function contentSecurityPolicy(isSecure: boolean): string {
  const directives = isSecure
    ? [...CSP_DIRECTIVES, "upgrade-insecure-requests"]
    : CSP_DIRECTIVES;

  return directives.join("; ");
}

export function applySecurityHeaders(headers: Headers, isSecure: boolean) {
  headers.set("Content-Security-Policy", contentSecurityPolicy(isSecure));

  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    if (name === "Strict-Transport-Security" && !isSecure) {
      continue;
    }

    headers.set(name, value);
  }
}
