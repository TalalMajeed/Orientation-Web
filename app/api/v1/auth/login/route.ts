import { NextRequest, NextResponse } from "next/server";

import { readJson } from "@/lib/request";
import { verifyMemberCredentials } from "@/services/auth/accounts";
import {
  SESSION_COOKIE_NAME,
  SESSION_DURATION_MS,
  createSessionToken,
  verifyCredentials,
  type StaffRole,
} from "@/services/auth/session";

export async function POST(request: NextRequest) {
  const body = await readJson(request);

  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { username, password } = body;

  if (typeof username !== "string" || typeof password !== "string") {
    return NextResponse.json(
      { error: "Username and password are required" },
      { status: 400 }
    );
  }

  const envRole = verifyCredentials(username, password);
  const memberUsername = envRole ? null : await verifyMemberCredentials(username, password);
  const role: StaffRole | null = envRole ?? (memberUsername ? "member" : null);

  if (!role) {
    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 }
    );
  }

  const sessionUsername = memberUsername ?? username;
  const response = NextResponse.json({ role }, { status: 200 });

  response.cookies.set(SESSION_COOKIE_NAME, createSessionToken(role, sessionUsername), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ message: "Logged out" }, { status: 200 });

  response.cookies.delete(SESSION_COOKIE_NAME);

  return response;
}
