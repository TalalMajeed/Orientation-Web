import { NextRequest, NextResponse } from "next/server";

import { requireRole } from "@/services/auth/guard";
import { readState, replaceStudents } from "@/services/liaison/db";
import { parseLog, parseStudents, readJsonBody } from "@/services/liaison/validate";
import { stateResponse, validationError } from "../_respond";

export async function GET(request: NextRequest) {
  const denied = requireRole(request, "liaison", "admin");

  if (denied) {
    return denied;
  }

  const { students, log } = await readState();

  return NextResponse.json({ students, log }, { status: 200 });
}

/**
 * PUT, not POST: an upload replaces the batch rather than adding to it. The
 * workbook is parsed in the browser (SheetJS reads cell values only), so what
 * arrives here is already rows — and is re-validated field by field regardless.
 */
export async function PUT(request: NextRequest) {
  const denied = requireRole(request, "liaison", "admin");

  if (denied) {
    return denied;
  }

  try {
    const body = await readJsonBody(request);
    const students = parseStudents(body.students);
    const log = parseLog(body.log);

    return stateResponse(await replaceStudents(students, log));
  } catch (error) {
    return validationError(error);
  }
}
