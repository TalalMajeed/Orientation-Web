import { NextRequest, NextResponse } from "next/server";

import {
  SESSION_COOKIE_NAME,
  SESSION_DURATION_MS,
  createSessionToken,
  verifyCredentials,
} from "@/services/auth/session";

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const username =
    typeof body === "object" && body !== null && "username" in body
      ? (body as { username: unknown }).username
      : undefined;
  const password =
    typeof body === "object" && body !== null && "password" in body
      ? (body as { password: unknown }).password
      : undefined;

  if (typeof username !== "string" || typeof password !== "string") {
    return NextResponse.json(
      { error: "Username and password are required" },
      { status: 400 }
    );
  }

  const role = verifyCredentials(username, password);

  if (!role) {
    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ role }, { status: 200 });

  response.cookies.set(SESSION_COOKIE_NAME, createSessionToken(role), {
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
