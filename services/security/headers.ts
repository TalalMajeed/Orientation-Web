/**
 * Security headers applied to every response by proxy.ts.
 *
 * The CSP is the interesting one. Next's App Router inlines its bootstrap and
 * flight payload, and `app/layout.tsx` inlines the theme-init script that has
 * to run before first paint or the page flashes the wrong theme — so
 * script-src needs 'unsafe-inline'. A nonce would be stricter, but a nonce has
 * to be generated per request, which opts every static page out of
 * prerendering; that is a real cost for a marketing site whose whole point is
 * the landing page. The policy is still worth having without it: it stops the
 * page being framed, stops plugin/object embeds, pins form targets and base
 * URIs, and holds connect/img/style to known origins.
 */

const CARTO_TILES = "https://*.basemaps.cartocdn.com";

const CSP_DIRECTIVES = [
  "default-src 'self'",
  // 'unsafe-eval' is not granted: nothing here compiles code at runtime.
  "script-src 'self' 'unsafe-inline'",
  // Tailwind v4 and the inline style attributes React renders need this.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: " + CARTO_TILES,
  "font-src 'self' data:",
  "media-src 'self'",
  "connect-src 'self' " + CARTO_TILES,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "frame-src 'none'",
];

/**
 * `upgrade-insecure-requests` is added only when the request already arrived
 * over https. Sending it on plain http would rewrite the page's own asset
 * requests to https — which is exactly how the documented dev workflow
 * (open the LAN IP on a phone, see `allowedDevOrigins`) breaks.
 */
export function contentSecurityPolicy(isSecure: boolean): string {
  const directives = isSecure
    ? [...CSP_DIRECTIVES, "upgrade-insecure-requests"]
    : CSP_DIRECTIVES;

  return directives.join("; ");
}

export const SECURITY_HEADERS: Record<string, string> = {
  // Redundant with frame-ancestors for modern browsers, kept for older ones.
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-DNS-Prefetch-Control": "off",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  // Nothing in the app uses these; denying them keeps a compromised script
  // from prompting for them under the site's name.
  "Permissions-Policy": [
    "camera=()",
    "microphone=()",
    "geolocation=()",
    "payment=()",
    "usb=()",
    "interest-cohort=()",
  ].join(", "),
  // Two years, preload-eligible. Only sent over HTTPS (see applySecurityHeaders).
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
};

export function applySecurityHeaders(headers: Headers, isSecure: boolean) {
  headers.set("Content-Security-Policy", contentSecurityPolicy(isSecure));

  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    // HSTS over plain http is meaningless, and on localhost it would pin the
    // whole dev machine to https for two years. Never send it there.
    if (name === "Strict-Transport-Security" && !isSecure) {
      continue;
    }

    headers.set(name, value);
  }
}
