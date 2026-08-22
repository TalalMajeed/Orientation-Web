import { NextRequest, NextResponse } from "next/server";

import { requireRole } from "@/services/auth/guard";
import { readState, replaceStudents } from "@/services/liaison/db";
import { stateResponse, validationError } from "@/services/liaison/respond";
import { parseLog, parseStudents, readJsonBody } from "@/services/liaison/validate";

export async function GET(request: NextRequest) {
  const denied = requireRole(request, "liaison", "admin", "member");

  if (denied) {
    return denied;
  }

  const { students, log } = await readState();

  return NextResponse.json({ students, log }, { status: 200 });
}

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
