import { NextRequest, NextResponse } from "next/server";

import { resolveShortLink } from "@/services/hr/links";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  const targetUrl = await resolveShortLink(id);

  if (!targetUrl) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  return NextResponse.redirect(targetUrl);
}
