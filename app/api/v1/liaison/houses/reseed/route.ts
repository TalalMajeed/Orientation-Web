import { NextRequest } from "next/server";

import { requireRole } from "@/services/auth/guard";
import { reseedHouses } from "@/services/liaison/db";
import { stateResponse } from "../../_respond";

// Restores the 10 seeded houses and their placeholder OL/OG names. Students
// keep their rows but lose their assignment, since the house ids are rebuilt.
export async function POST(request: NextRequest) {
  const denied = requireRole(request, "liaison", "admin");

  if (denied) {
    return denied;
  }

  return stateResponse(await reseedHouses());
}
