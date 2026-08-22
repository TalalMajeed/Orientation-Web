import { NextRequest, NextResponse } from "next/server";

import { requireRole } from "@/services/auth/guard";
import { cancelDispatch, startDispatch } from "@/services/email/campaign";
import { emailValidationError } from "@/services/email/validate";

export async function POST(request: NextRequest) {
  const denied = requireRole(request, "liaison", "admin", "member");

  if (denied) {
    return denied;
  }

  try {
    return NextResponse.json({ progress: await startDispatch() }, { status: 202 });
  } catch (error) {
    return emailValidationError(error);
  }
}

export async function DELETE(request: NextRequest) {
  const denied = requireRole(request, "liaison", "admin", "member");

  if (denied) {
    return denied;
  }

  try {
    return NextResponse.json({ progress: await cancelDispatch() }, { status: 200 });
  } catch (error) {
    return emailValidationError(error);
  }
}
