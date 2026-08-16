import { NextRequest } from "next/server";

import { requireRole } from "@/services/auth/guard";
import { setConfig } from "@/services/liaison/db";
import { parseHouseCapacity, readJsonBody } from "@/services/liaison/validate";
import { stateResponse, validationError } from "../_respond";

export async function PATCH(request: NextRequest) {
  const denied = requireRole(request, "liaison", "admin");

  if (denied) {
    return denied;
  }

  try {
    const body = await readJsonBody(request);

    // Absent means "leave it alone"; an explicit null means "no cap".
    if (!("houseCapacity" in body)) {
      return stateResponse(await setConfig({}));
    }

    const houseCapacity = parseHouseCapacity(body.houseCapacity);

    return stateResponse(await setConfig({ houseCapacity }));
  } catch (error) {
    return validationError(error);
  }
}
