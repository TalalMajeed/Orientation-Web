import { NextRequest } from "next/server";

import { requireRole } from "@/services/auth/guard";
import { resetAllocation, runAllocation } from "@/services/liaison/db";
import { parseStudents, readJsonBody } from "@/services/liaison/validate";
import { stateResponse, validationError } from "../_respond";

/**
 * Runs the division. The allocator lives on the server so the rule that
 * decides which student lands in which house cannot be edited in devtools.
 * An optional `students` body seeds a roster and divides it in one write —
 * that is the "load a demo batch" button.
 */
export async function POST(request: NextRequest) {
  const denied = requireRole(request, "liaison", "admin");

  if (denied) {
    return denied;
  }

  try {
    const hasBody = (request.headers.get("content-length") ?? "0") !== "0";
    const body = hasBody ? await readJsonBody(request) : {};
    const students =
      "students" in body ? parseStudents(body.students) : undefined;

    return stateResponse(await runAllocation(students));
  } catch (error) {
    return validationError(error);
  }
}

// Clears every assignment but keeps the roster.
export async function DELETE(request: NextRequest) {
  const denied = requireRole(request, "liaison", "admin");

  if (denied) {
    return denied;
  }

  return stateResponse(await resetAllocation());
}
