import { NextRequest, NextResponse } from "next/server";

import { requireRole } from "@/services/auth/guard";
import {
  InvalidUrlError,
  createShortLink,
  listShortLinks,
} from "@/services/hr/links";

export async function GET(request: NextRequest) {
  const denied = requireRole(request, "admin");

  if (denied) {
    return denied;
  }

  const links = await listShortLinks();

  return NextResponse.json({ links }, { status: 200 });
}

export async function POST(request: NextRequest) {
  const denied = requireRole(request, "admin");

  if (denied) {
    return denied;
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
