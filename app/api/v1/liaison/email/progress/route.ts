import { NextRequest, NextResponse } from "next/server";

import { requireRole } from "@/services/auth/guard";
import { readProgress } from "@/services/email/campaign";

export async function GET(request: NextRequest) {
  const denied = requireRole(request, "liaison", "admin");

  if (denied) {
    return denied;
  }

  return NextResponse.json({ progress: await readProgress() }, { status: 200 });
}
