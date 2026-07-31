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
const GUARDED: { prefix: string; roles: StaffRole[] }[] = [
  { prefix: "/scan", roles: ["scanner", "admin"] },
  { prefix: "/event-tickets", roles: ["admin"] },
  { prefix: "/hr", roles: ["admin"] },
];

/** Where each role belongs when the page they asked for is not theirs. */
const LANDING: Record<StaffRole, string> = {
  admin: "/event-tickets",
  scanner: "/scan",
};

/**
 * Redirects only — never the security boundary. Every route handler re-checks
 * the session itself, so a gap here cannot expose a page's data.
 */
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Already a redirect to the shared login page; gating it would loop.
  if (pathname === "/hr/login") {
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
