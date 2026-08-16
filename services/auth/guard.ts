import "server-only";

import { NextResponse, type NextRequest } from "next/server";

import { getRequestSession, hasRole, type StaffRole } from "@/services/auth/session";

export function requireRole(
  request: NextRequest,
  ...allowed: StaffRole[]
): NextResponse | null {
  if (hasRole(getRequestSession(request), ...allowed)) {
    return null;
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
