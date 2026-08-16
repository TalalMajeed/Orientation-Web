import { NextRequest } from "next/server";

import { requireRole } from "@/services/auth/guard";
import { updateHouse, updateOg } from "@/services/liaison/db";
import { stateResponse, validationError } from "@/services/liaison/respond";
import { parseText, readJsonBody } from "@/services/liaison/validate";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const denied = requireRole(request, "liaison", "admin");

  if (denied) {
    return denied;
  }

  const { id } = await params;

  try {
    const body = await readJsonBody(request);

    if ("ogId" in body) {
      const ogId = parseText(body.ogId, "ogId");
      const name = parseText(body.name, "name", { allowEmpty: true });

      return stateResponse(await updateOg(id, ogId, name));
    }

    const ol = parseText(body.ol, "ol", { allowEmpty: true });

    return stateResponse(await updateHouse(id, { ol }));
  } catch (error) {
    return validationError(error);
  }
}
