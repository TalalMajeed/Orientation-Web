import { NextResponse, type NextRequest } from "next/server";

import {
  type StaffRole,
  getRequestSession,
  hasRole,
} from "@/services/auth/session";
import { applySecurityHeaders } from "@/services/security/headers";
import { checkRateLimit, type RateLimitRule } from "@/services/security/rateLimit";

/**
 * Proxy always runs on the Node.js runtime, so it can reuse the real session
 * module — which signs with node:crypto — instead of a second Web Crypto
 * implementation of the same check.
 *
 * Route segment config is not allowed here, so the path filter lives inline.
 *
 * Three jobs, in order: rate limiting, redirects for guarded pages, and
 * security headers on the way out. Only the first is a hard stop; the redirect
 * is convenience — every route handler calls requireRole itself.
 */
const GUARDED: { prefix: string; roles: StaffRole[] }[] = [
  { prefix: "/hr", roles: ["admin"] },
  { prefix: "/liaison", roles: ["liaison", "admin"] },
];

// Paths that sit under a guarded prefix but must stay public.
const PUBLIC_EXCEPTIONS = ["/hr/login", "/liaison/login"];

/** Where each role belongs when the page they asked for is not theirs. */
const LANDING: Record<StaffRole, string> = {
  admin: "/hr",
  liaison: "/liaison",
};

// --- Rate limits -------------------------------------------------------------

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

/**
 * Budgets are per IP per window. They are set from what the panels actually
 * do — the liaison store issues one request per action, and a page load is a
 * handful — so a real operator never approaches them, while a script does
 * immediately.
 */
const LOGIN_RULE: RateLimitRule = { limit: 10, windowMs: 15 * MINUTE };
const PUBLIC_WRITE_RULE: RateLimitRule = { limit: 10, windowMs: HOUR };
const WRITE_RULE: RateLimitRule = { limit: 60, windowMs: MINUTE };
const READ_RULE: RateLimitRule = { limit: 200, windowMs: MINUTE };

/** Endpoints anyone can reach without a session get the tightest budget —
 *  they are the ones a stranger can spend. */
const PUBLIC_WRITE_PATHS = ["/api/v1/newsletter"];

const READ_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function ruleFor(pathname: string, method: string): RateLimitRule {
  if (pathname === "/api/v1/auth/login" && method === "POST") {
    return LOGIN_RULE;
  }

  if (PUBLIC_WRITE_PATHS.includes(pathname) && !READ_METHODS.has(method)) {
    return PUBLIC_WRITE_RULE;
  }

  return READ_METHODS.has(method) ? READ_RULE : WRITE_RULE;
}

/**
 * The client address as the platform reports it. Behind a proxy that is
 * `x-forwarded-for`'s first entry — which the client can forge if requests
 * can reach the app without passing through that proxy. Deploy so they cannot
 * (Vercel and Cloud Run both overwrite the header), or this degrades to a
 * speed bump rather than a limit.
 */
function clientKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");

  if (forwarded) {
    const first = forwarded.split(",")[0].trim();

    if (first) {
      return first;
    }
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

/** Rate-limited surfaces: the API, and /invite, which is a route handler that
 *  hits the database on every request even though it does not live under /api. */
function isRateLimited(pathname: string): boolean {
  return pathname.startsWith("/api/") || pathname.startsWith("/invite/");
}

function withHeaders(response: NextResponse, request: NextRequest): NextResponse {
  applySecurityHeaders(
    response.headers,
    request.nextUrl.protocol === "https:" ||
      request.headers.get("x-forwarded-proto") === "https"
  );

  return response;
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // No dedicated favicon asset — it's just the logo.
  if (pathname === "/favicon.ico") {
    return withHeaders(
      NextResponse.rewrite(new URL("/logo.png", request.url)),
      request
    );
  }

  if (isRateLimited(pathname)) {
    const rule = ruleFor(pathname, request.method);
    const result = checkRateLimit(`${clientKey(request)}:${pathname}`, rule);

    if (!result.allowed) {
      const limited = NextResponse.json(
        { error: "Too many requests. Try again shortly." },
        { status: 429 }
      );

      limited.headers.set("Retry-After", String(result.retryAfterSeconds));
      limited.headers.set("RateLimit-Limit", String(result.limit));
      limited.headers.set("RateLimit-Remaining", "0");
      limited.headers.set(
        "RateLimit-Reset",
        String(result.retryAfterSeconds)
      );

      return withHeaders(limited, request);
    }
  }

  if (
    PUBLIC_EXCEPTIONS.some(
      (exception) => pathname === exception || pathname.startsWith(`${exception}/`)
    )
  ) {
    return withHeaders(NextResponse.next(), request);
  }

  const guard = GUARDED.find(
    (entry) => pathname === entry.prefix || pathname.startsWith(`${entry.prefix}/`)
  );

  if (!guard) {
    return withHeaders(NextResponse.next(), request);
  }

  const session = getRequestSession(request);

  if (hasRole(session, ...guard.roles)) {
    return withHeaders(NextResponse.next(), request);
  }

  // Signed in, wrong role. Sending them to /login would ask for credentials
  // they already have and then land them here anyway, so go straight to their
  // own page and carry the reason. The inequality is a loop guard: a role whose
  // landing page it cannot itself open would otherwise redirect forever.
  if (session && LANDING[session.role] !== pathname) {
    const url = new URL(LANDING[session.role], request.url);
    url.searchParams.set("denied", pathname);

    return withHeaders(NextResponse.redirect(url), request);
  }

  const url = new URL("/login", request.url);
  url.searchParams.set("next", pathname);

  return withHeaders(NextResponse.redirect(url), request);
}
