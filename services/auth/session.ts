import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import dotenv from "dotenv";

dotenv.config();

const SESSION_COOKIE_NAME = "hr_session";
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

export type StaffRole = "admin" | "scanner";

export interface StaffSession {
  role: StaffRole;
  expiresAt: number;
}

const ROLES: StaffRole[] = ["admin", "scanner"];

function isStaffRole(candidate: string): candidate is StaffRole {
  return (ROLES as string[]).includes(candidate);
}

function getSessionSecret(): string {
  const sessionSecret = process.env.HR_SESSION_SECRET;

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

function matches(
  candidateUsername: string,
  candidatePassword: string,
  expectedUsername: string | undefined,
  expectedPassword: string | undefined
): boolean {
  if (!expectedUsername || !expectedPassword) {
    return false;
  }

  // Both comparisons always run so a wrong username and a wrong password cost
  // the same amount of time.
  const usernameOk = safeEqual(candidateUsername, expectedUsername);
  const passwordOk = safeEqual(candidatePassword, expectedPassword);

  return usernameOk && passwordOk;
}

/**
 * Resolves credentials to a role. Admin credentials are the pre-existing
 * HR_USERNAME/HR_PASSWORD pair, so the HR invite-link panel keeps working.
 * Scanner credentials are optional: if they are not configured, nobody can log
 * in as a scanner, but admin login is unaffected.
 */
export function verifyCredentials(
  candidateUsername: string,
  candidatePassword: string
): StaffRole | null {
  const adminUsername = process.env.HR_USERNAME;
  const adminPassword = process.env.HR_PASSWORD;
  const scannerUsername = process.env.SCANNER_USERNAME;
  const scannerPassword = process.env.SCANNER_PASSWORD;

  if (!adminUsername || !adminPassword) {
    throw new Error(
      "Missing required environment variable: HR_USERNAME or HR_PASSWORD"
    );
  }

  if (matches(candidateUsername, candidatePassword, adminUsername, adminPassword)) {
    return "admin";
  }

  if (
    matches(candidateUsername, candidatePassword, scannerUsername, scannerPassword)
  ) {
    return "scanner";
  }

  return null;
}

/**
 * The role lives INSIDE the signed payload. Appending it outside the signature
 * would let a scanner rewrite their own cookie to say "admin".
 */
export function createSessionToken(role: StaffRole): string {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const payload = `${expiresAt}:${role}`;

  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(
  token: string | undefined | null
): StaffSession | null {
  if (!token) {
    return null;
  }

  const separatorIndex = token.lastIndexOf(".");

  if (separatorIndex <= 0) {
    return null;
  }

  const payload = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);

  if (!safeEqual(sign(payload), signature)) {
    return null;
  }

  const [rawExpiresAt, rawRole] = payload.split(":");
  const expiresAt = Number(rawExpiresAt);

  // Sessions minted before roles existed have no role segment and are rejected,
  // which just means those staff log in again.
  if (!rawRole || !isStaffRole(rawRole)) {
    return null;
  }

  if (!Number.isFinite(expiresAt) || Date.now() >= expiresAt) {
    return null;
  }

  return { role: rawRole, expiresAt };
}

export function getRequestSession(request: NextRequest): StaffSession | null {
  return verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
}

export function hasRole(
  session: StaffSession | null,
  ...allowed: StaffRole[]
): boolean {
  return session !== null && allowed.includes(session.role);
}

export { SESSION_COOKIE_NAME, SESSION_DURATION_MS };
