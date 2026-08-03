import { NextRequest, NextResponse } from "next/server";

import { requireRole } from "@/services/auth/guard";
import { HuntCodeNotFoundError, deleteCode } from "@/services/hunt/codes";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const denied = requireRole(request, "admin", "hunt");

  if (denied) {
    return denied;
  }

  const { id } = await params;

  try {
    await deleteCode(id);

    return NextResponse.json({ message: "Deleted" }, { status: 200 });
  } catch (error) {
    if (error instanceof HuntCodeNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    throw error;
  }
}
