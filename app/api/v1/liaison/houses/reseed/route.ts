import { NextRequest } from "next/server";

import { requireRole } from "@/services/auth/guard";
import { reseedHouses } from "@/services/liaison/db";
import { stateResponse } from "@/services/liaison/respond";

export async function POST(request: NextRequest) {
  const denied = requireRole(request, "liaison", "admin");

  if (denied) {
    return denied;
  }

  return stateResponse(await reseedHouses());
}
