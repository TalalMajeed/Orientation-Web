import { NextRequest } from "next/server";

import { requireRole } from "@/services/auth/guard";
import { readState, resetState } from "@/services/liaison/db";
import { stateResponse } from "@/services/liaison/respond";

export async function GET(request: NextRequest) {
  const denied = requireRole(request, "liaison", "admin");

  if (denied) {
    return denied;
  }

  return stateResponse(await readState());
}

export async function DELETE(request: NextRequest) {
  const denied = requireRole(request, "liaison", "admin");

  if (denied) {
    return denied;
  }

  return stateResponse(await resetState());
}
