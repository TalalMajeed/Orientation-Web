import { NextResponse, type NextRequest } from "next/server";

import { getRequestSession, hasRole, type StaffRole } from "@/services/auth/session";
import { applySecurityHeaders } from "@/services/security/headers";
import { checkRateLimit, type RateLimitRule } from "@/services/security/limit";

const GUARDED: { prefix: string; roles: StaffRole[] }[] = [
  { prefix: "/hr", roles: ["admin"] },
  { prefix: "/liaison", roles: ["liaison", "admin"] },
];

const PUBLIC_EXCEPTIONS = ["/hr/login", "/liaison/login"];

const LANDING: Record<StaffRole, string> = {
  admin: "/hr",
  liaison: "/liaison",
};

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

const LOGIN_RULE: RateLimitRule = { limit: 10, windowMs: 15 * MINUTE };
const PUBLIC_WRITE_RULE: RateLimitRule = { limit: 10, windowMs: HOUR };
const CONTACT_RULE: RateLimitRule = { limit: 3, windowMs: 10 * MINUTE };
const WRITE_RULE: RateLimitRule = { limit: 60, windowMs: MINUTE };
const READ_RULE: RateLimitRule = { limit: 200, windowMs: MINUTE };

const CONTACT_PATH = "/api/v1/contact";
const PUBLIC_WRITE_PATHS = ["/api/v1/newsletter"];
const READ_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function ruleFor(pathname: string, method: string): RateLimitRule {
  if (pathname === "/api/v1/auth/login" && method === "POST") {
    return LOGIN_RULE;
  }

  if (pathname === CONTACT_PATH && !READ_METHODS.has(method)) {
    return CONTACT_RULE;
  }

  if (PUBLIC_WRITE_PATHS.includes(pathname) && !READ_METHODS.has(method)) {
    return PUBLIC_WRITE_RULE;
  }

  return READ_METHODS.has(method) ? READ_RULE : WRITE_RULE;
}

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

function isRateLimited(pathname: string): boolean {
  return pathname.startsWith("/api/") || pathname.startsWith("/invite/");
}

function isSecureRequest(request: NextRequest): boolean {
  return (
    request.nextUrl.protocol === "https:" ||
    request.headers.get("x-forwarded-proto") === "https"
  );
}

function withHeaders(response: NextResponse, request: NextRequest): NextResponse {
  applySecurityHeaders(response.headers, isSecureRequest(request));

  return response;
}

function tooManyRequests(retryAfterSeconds: number, limit: number): NextResponse {
  const response = NextResponse.json(
    { error: "Too many requests. Try again shortly." },
    { status: 429 }
  );

  response.headers.set("Retry-After", String(retryAfterSeconds));
  response.headers.set("RateLimit-Limit", String(limit));
  response.headers.set("RateLimit-Remaining", "0");
  response.headers.set("RateLimit-Reset", String(retryAfterSeconds));

  return response;
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/favicon.ico") {
    return withHeaders(NextResponse.rewrite(new URL("/logo.png", request.url)), request);
  }

  if (isRateLimited(pathname)) {
    const rule = ruleFor(pathname, request.method);
    const result = checkRateLimit(`${clientKey(request)}:${pathname}`, rule);

    if (!result.allowed) {
      return withHeaders(tooManyRequests(result.retryAfterSeconds, result.limit), request);
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

  if (session && LANDING[session.role] !== pathname) {
    const landing = new URL(LANDING[session.role], request.url);
    landing.searchParams.set("denied", pathname);

    return withHeaders(NextResponse.redirect(landing), request);
  }

  const login = new URL("/login", request.url);
  login.searchParams.set("next", pathname);

  return withHeaders(NextResponse.redirect(login), request);
}
