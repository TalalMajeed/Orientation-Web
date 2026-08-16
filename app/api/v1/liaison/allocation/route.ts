import { NextRequest } from "next/server";

import { requireRole } from "@/services/auth/guard";
import { resetAllocation, runAllocation } from "@/services/liaison/db";
import { stateResponse, validationError } from "@/services/liaison/respond";
import { parseStudents, readJsonBody } from "@/services/liaison/validate";

export async function POST(request: NextRequest) {
  const denied = requireRole(request, "liaison", "admin");

  if (denied) {
    return denied;
  }

  try {
    const hasBody = (request.headers.get("content-length") ?? "0") !== "0";
    const body = hasBody ? await readJsonBody(request) : {};
    const students = "students" in body ? parseStudents(body.students) : undefined;

    return stateResponse(await runAllocation(students));
  } catch (error) {
    return validationError(error);
  }
}

export async function DELETE(request: NextRequest) {
  const denied = requireRole(request, "liaison", "admin");

  if (denied) {
    return denied;
  }

  return stateResponse(await resetAllocation());
}
