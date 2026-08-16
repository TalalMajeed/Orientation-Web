import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import dotenv from "dotenv";

dotenv.config();

const SESSION_COOKIE_NAME = "hr_session";
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

export type StaffRole = "admin" | "liaison";

export interface StaffSession {
  role: StaffRole;
  expiresAt: number;
}

const ROLES: StaffRole[] = ["admin", "liaison"];

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
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return timingSafeEqual(bufferA, bufferB);
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

  const usernameOk = safeEqual(candidateUsername, expectedUsername);
  const passwordOk = safeEqual(candidatePassword, expectedPassword);

  return usernameOk && passwordOk;
}

export function verifyCredentials(
  candidateUsername: string,
  candidatePassword: string
): StaffRole | null {
  const adminUsername = process.env.HR_USERNAME;
  const adminPassword = process.env.HR_PASSWORD;
  const liaisonUsername = process.env.LIAISON_USERNAME;
  const liaisonPassword = process.env.LIAISON_PASSWORD;

  if (!adminUsername || !adminPassword) {
    throw new Error("Missing required environment variable: HR_USERNAME or HR_PASSWORD");
  }

  if (matches(candidateUsername, candidatePassword, adminUsername, adminPassword)) {
    return "admin";
  }

  if (matches(candidateUsername, candidatePassword, liaisonUsername, liaisonPassword)) {
    return "liaison";
  }

  return null;
}

export function createSessionToken(role: StaffRole): string {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const payload = `${expiresAt}:${role}`;

  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined | null): StaffSession | null {
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

export function hasRole(session: StaffSession | null, ...allowed: StaffRole[]): boolean {
  return session !== null && allowed.includes(session.role);
}

export { SESSION_COOKIE_NAME, SESSION_DURATION_MS };
