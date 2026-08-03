import { NextResponse, type NextRequest } from "next/server";

import {
  type StaffRole,
  getRequestSession,
  hasRole,
} from "@/services/auth/session";

/**
 * Proxy always runs on the Node.js runtime, so it can reuse the real session
 * module — which signs with node:crypto — instead of a second Web Crypto
 * implementation of the same check.
 *
 * Route segment config is not allowed here, so the path filter lives inline.
 */
// /socials self-gates (renders its own login), and /scan just redirects to it,
// so neither is listed here — proxy only guards the pages that bounce to /login.
const GUARDED: { prefix: string; roles: StaffRole[] }[] = [
  { prefix: "/event-tickets", roles: ["admin"] },
  { prefix: "/hr", roles: ["admin"] },
  { prefix: "/hunt", roles: ["admin", "hunt"] },
];

// Paths that sit under a guarded prefix but must stay public — /hunt/c/<code>
// is the page a student's phone opens straight from the QR, with no session.
const PUBLIC_EXCEPTIONS = ["/hr/login", "/hunt/c"];

/**
 * Redirects only — never the security boundary. Every route handler re-checks
 * the session itself, so a gap here cannot expose a page's data.
 */
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    PUBLIC_EXCEPTIONS.some(
      (exception) => pathname === exception || pathname.startsWith(`${exception}/`)
    )
  ) {
    return NextResponse.next();
  }

  const guard = GUARDED.find(
    (entry) => pathname === entry.prefix || pathname.startsWith(`${entry.prefix}/`)
  );

  if (!guard) {
    return NextResponse.next();
  }

  if (hasRole(getRequestSession(request), ...guard.roles)) {
    return NextResponse.next();
  }

  const url = new URL("/login", request.url);
  url.searchParams.set("next", pathname);

  return NextResponse.redirect(url);
}
