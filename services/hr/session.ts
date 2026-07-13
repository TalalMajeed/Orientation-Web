import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import dotenv from "dotenv";

dotenv.config();

const SESSION_COOKIE_NAME = "hr_session";
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

const username = process.env.HR_USERNAME;
const password = process.env.HR_PASSWORD;
const sessionSecret = process.env.HR_SESSION_SECRET;

function getSessionSecret(): string {
  if (!sessionSecret) {
    throw new Error("Missing required environment variable: HR_SESSION_SECRET");
  }

  return sessionSecret;
}

function sign(value: string): string {
  return createHmac("sha256", getSessionSecret()).update(value).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  if (bufA.length !== bufB.length) {
    return false;
  }

  return timingSafeEqual(bufA, bufB);
}

export function verifyHrCredentials(
  candidateUsername: string,
  candidatePassword: string
): boolean {
  if (!username || !password) {
    throw new Error(
      "Missing required environment variable: HR_USERNAME or HR_PASSWORD"
    );
  }

  return (
    safeEqual(candidateUsername, username) &&
    safeEqual(candidatePassword, password)
  );
}

export function createSessionToken(): string {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const payload = String(expiresAt);
  const signature = sign(payload);

  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) {
    return false;
  }

  const [payload, signature] = token.split(".");

  if (!payload || !signature) {
    return false;
  }

  if (!safeEqual(sign(payload), signature)) {
    return false;
  }

  const expiresAt = Number(payload);

  return Number.isFinite(expiresAt) && Date.now() < expiresAt;
}

export function isHrRequestAuthenticated(request: NextRequest): boolean {
  return verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
}

export { SESSION_COOKIE_NAME, SESSION_DURATION_MS };
