import "server-only";

import { NextResponse, type NextRequest } from "next/server";

import {
  type StaffRole,
  getRequestSession,
  hasRole,
} from "@/services/auth/session";

/**
 * Returns a 401 response when the caller lacks every allowed role, or null when
 * they are permitted. Route handlers must call this themselves — middleware
 * handles redirects, it is not the security boundary.
 *
 *   const denied = requireRole(request, "admin");
 *   if (denied) return denied;
 */
export function requireRole(
  request: NextRequest,
  ...allowed: StaffRole[]
): NextResponse | null {
  if (hasRole(getRequestSession(request), ...allowed)) {
    return null;
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
