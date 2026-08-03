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

/** Where each role belongs when the page they asked for is not theirs. */
const LANDING: Record<StaffRole, string> = {
  admin: "/event-tickets",
  scanner: "/scan",
  hunt: "/hunt",
};

/**
 * Redirects only — never the security boundary. Every route handler re-checks
 * the session itself, so a gap here cannot expose a page's data.
 */
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Dev builds show the v2 logo; production keeps the real one and the v2
  // asset is not reachable at all, even by guessing its direct URL.
  const isLocalhost = request.nextUrl.hostname.includes("localhost");

  if (pathname === "/logo-v2.png") {
    return isLocalhost
      ? NextResponse.next()
      : new NextResponse(null, { status: 404 });
  }

  if (pathname === "/logo.png" && isLocalhost) {
    return NextResponse.rewrite(new URL("/logo-v2.png", request.url));
  }

  // No dedicated favicon asset — it's just whichever logo is active.
  if (pathname === "/favicon.ico") {
    return NextResponse.rewrite(
      new URL(isLocalhost ? "/logo-v2.png" : "/logo.png", request.url)
    );
  }

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

  const session = getRequestSession(request);

  if (hasRole(session, ...guard.roles)) {
    return NextResponse.next();
  }

  // Signed in, wrong role. Sending them to /login would ask for credentials
  // they already have and then land them here anyway, so go straight to their
  // own page and carry the reason. The inequality is a loop guard: a role whose
  // landing page it cannot itself open would otherwise redirect forever.
  if (session && LANDING[session.role] !== pathname) {
    const url = new URL(LANDING[session.role], request.url);
    url.searchParams.set("denied", pathname);

    return NextResponse.redirect(url);
  }

  const url = new URL("/login", request.url);
  url.searchParams.set("next", pathname);

  return NextResponse.redirect(url);
}
