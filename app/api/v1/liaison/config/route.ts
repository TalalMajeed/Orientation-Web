import { NextRequest } from "next/server";

import { requireRole } from "@/services/auth/guard";
import { setConfig } from "@/services/liaison/db";
import { stateResponse, validationError } from "@/services/liaison/respond";
import { parseHouseCapacity, readJsonBody } from "@/services/liaison/validate";

export async function PATCH(request: NextRequest) {
  const denied = requireRole(request, "liaison", "admin");

  if (denied) {
    return denied;
  }

  try {
    const body = await readJsonBody(request);

    if (!("houseCapacity" in body)) {
      return stateResponse(await setConfig({}));
    }

    return stateResponse(await setConfig({ houseCapacity: parseHouseCapacity(body.houseCapacity) }));
  } catch (error) {
    return validationError(error);
  }
}
