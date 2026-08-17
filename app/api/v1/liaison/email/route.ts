import { NextRequest, NextResponse } from "next/server";

import { requireRole } from "@/services/auth/guard";
import {
  CAMPAIGN_SENDER,
  clearCampaign,
  readCampaign,
  saveDraft,
  saveSheet,
} from "@/services/email/campaign";
import {
  emailValidationError,
  parseDraftInput,
  parseSheetInput,
  readEmailJsonBody,
} from "@/services/email/validate";

export async function GET(request: NextRequest) {
  const denied = requireRole(request, "liaison", "admin");

  if (denied) {
    return denied;
  }

  return NextResponse.json(
    { campaign: await readCampaign(), sender: CAMPAIGN_SENDER },
    { status: 200 }
  );
}

export async function PUT(request: NextRequest) {
  const denied = requireRole(request, "liaison", "admin");

  if (denied) {
    return denied;
  }

  try {
    const body = await readEmailJsonBody(request);
    const campaign = await saveSheet(parseSheetInput(body));

    return NextResponse.json({ campaign }, { status: 200 });
  } catch (error) {
    return emailValidationError(error);
  }
}

export async function PATCH(request: NextRequest) {
  const denied = requireRole(request, "liaison", "admin");

  if (denied) {
    return denied;
  }

  try {
    const body = await readEmailJsonBody(request);
    const draft = parseDraftInput(body);

    return NextResponse.json(
      { progress: await saveDraft(draft.subject, draft.body) },
      { status: 200 }
    );
  } catch (error) {
    return emailValidationError(error);
  }
}

export async function DELETE(request: NextRequest) {
  const denied = requireRole(request, "liaison", "admin");

  if (denied) {
    return denied;
  }

  try {
    return NextResponse.json({ campaign: await clearCampaign() }, { status: 200 });
  } catch (error) {
    return emailValidationError(error);
  }
}
