import { NextRequest, NextResponse } from "next/server";

import { getRequestSession } from "@/services/auth/session";

export async function GET(request: NextRequest) {
  const session = getRequestSession(request);

  if (!session) {
    return NextResponse.json({ session: null }, { status: 200 });
  }

  return NextResponse.json(
    { session: { role: session.role, username: session.username } },
    { status: 200 }
  );
}
