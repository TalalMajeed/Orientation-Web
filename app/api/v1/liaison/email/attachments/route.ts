import { NextRequest, NextResponse } from "next/server";

import { requireRole } from "@/services/auth/guard";
import { addAttachment, removeAttachment } from "@/services/email/campaign";
import {
  emailValidationError,
  parseAttachmentUpload,
  readEmailJsonBody,
} from "@/services/email/validate";

export async function POST(request: NextRequest) {
  const denied = requireRole(request, "liaison", "admin", "member");

  if (denied) {
    return denied;
  }

  try {
    const form = await request.formData().catch(() => null);
    const upload = await parseAttachmentUpload(form?.get("file"));

    return NextResponse.json({ campaign: await addAttachment(upload) }, { status: 200 });
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
    const body = await readEmailJsonBody(request);
    const id = typeof body.id === "string" ? body.id : "";

    return NextResponse.json({ campaign: await removeAttachment(id) }, { status: 200 });
  } catch (error) {
    return emailValidationError(error);
  }
}
