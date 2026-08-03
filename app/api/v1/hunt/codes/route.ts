import { NextRequest, NextResponse } from "next/server";

import { requireRole } from "@/services/auth/guard";
import { createCodes, deleteCodes, listCodes } from "@/services/hunt/codes";

export async function GET(request: NextRequest) {
  const denied = requireRole(request, "admin", "hunt");

  if (denied) {
    return denied;
  }

  const codes = await listCodes();

  return NextResponse.json({ codes }, { status: 200 });
}

export async function POST(request: NextRequest) {
  const denied = requireRole(request, "admin", "hunt");

  if (denied) {
    return denied;
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const raw = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const count = Number(raw.count);

  if (!Number.isFinite(count) || count < 1) {
    return NextResponse.json({ error: "A positive count is required" }, { status: 400 });
  }

  const labelPrefix =
    typeof raw.labelPrefix === "string" && raw.labelPrefix.trim().length > 0
      ? raw.labelPrefix.trim()
      : null;

  const codes = await createCodes({ count, labelPrefix });

  return NextResponse.json({ codes }, { status: 201 });
}

// Bulk delete for the admin panel's multi-select — DELETE on /codes/[id] stays
// the single-row path, this one takes a list.
export async function DELETE(request: NextRequest) {
  const denied = requireRole(request, "admin", "hunt");

  if (denied) {
    return denied;
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const raw = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const ids = Array.isArray(raw.ids) ? raw.ids.filter((id): id is string => typeof id === "string") : [];

  if (ids.length === 0) {
    return NextResponse.json({ error: "At least one id is required" }, { status: 400 });
  }

  const deletedCount = await deleteCodes(ids);

  return NextResponse.json({ deletedCount }, { status: 200 });
}
