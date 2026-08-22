import { NextRequest, NextResponse } from "next/server";

import { requireRole } from "@/services/auth/guard";
import { sendTest } from "@/services/email/campaign";
import {
  emailValidationError,
  parseTestInput,
  readEmailJsonBody,
} from "@/services/email/validate";

export async function POST(request: NextRequest) {
  const denied = requireRole(request, "liaison", "admin", "member");

  if (denied) {
    return denied;
  }

  try {
    const body = await readEmailJsonBody(request);
    const sentTo = await sendTest(parseTestInput(body));

    return NextResponse.json({ sentTo }, { status: 200 });
  } catch (error) {
    return emailValidationError(error);
  }
}
