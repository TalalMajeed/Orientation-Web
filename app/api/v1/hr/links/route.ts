import { NextRequest, NextResponse } from "next/server";

import { isHrRequestAuthenticated } from "@/services/hr/session";
import {
  InvalidUrlError,
  createShortLink,
  listShortLinks,
} from "@/services/hr/links";

export async function GET(request: NextRequest) {
  if (!isHrRequestAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const links = await listShortLinks();

  return NextResponse.json({ links }, { status: 200 });
}

export async function POST(request: NextRequest) {
  if (!isHrRequestAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const url =
    typeof body === "object" && body !== null && "url" in body
      ? (body as { url: unknown }).url
      : undefined;

  if (typeof url !== "string" || url.trim().length === 0) {
    return NextResponse.json({ error: "A URL is required" }, { status: 400 });
  }

  try {
    const link = await createShortLink(url.trim());

    return NextResponse.json({ link }, { status: 201 });
  } catch (error) {
    if (error instanceof InvalidUrlError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    throw error;
  }
}
