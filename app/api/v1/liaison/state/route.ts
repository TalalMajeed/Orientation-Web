import { NextRequest } from "next/server";

import { requireRole } from "@/services/auth/guard";
import { readState, resetState } from "@/services/liaison/db";
import { stateResponse } from "../_respond";

// The whole workspace in one read — the panel's four views all render from it.
export async function GET(request: NextRequest) {
  const denied = requireRole(request, "liaison", "admin");

  if (denied) {
    return denied;
  }

  return stateResponse(await readState());
}

// "Clear everything" — back to seeded houses and an empty roster.
export async function DELETE(request: NextRequest) {
  const denied = requireRole(request, "liaison", "admin");

  if (denied) {
    return denied;
  }

  return stateResponse(await resetState());
}
