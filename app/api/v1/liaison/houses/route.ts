import { NextRequest, NextResponse } from "next/server";

import { requireRole } from "@/services/auth/guard";
import { readState } from "@/services/liaison/db";

export async function GET(request: NextRequest) {
  const denied = requireRole(request, "liaison", "admin");

  if (denied) {
    return denied;
  }

  const { houses } = await readState();

  return NextResponse.json({ houses }, { status: 200 });
}
