import { NextRequest, NextResponse } from "next/server";

import { requireRole } from "@/services/auth/guard";
import {
  InvalidUrlError,
  ShortLinkNotFoundError,
  deleteShortLink,
  updateShortLink,
} from "@/services/hr/links";

type RouteContext = { params: Promise<{ shortId: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const denied = requireRole(request, "admin");

  if (denied) {
    return denied;
  }

  const { shortId } = await params;

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
    const link = await updateShortLink(shortId, url.trim());

    return NextResponse.json({ link }, { status: 200 });
  } catch (error) {
    if (error instanceof InvalidUrlError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof ShortLinkNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    throw error;
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const denied = requireRole(request, "admin");

  if (denied) {
    return denied;
  }

  const { shortId } = await params;

  try {
    await deleteShortLink(shortId);

    return NextResponse.json({ message: "Deleted" }, { status: 200 });
  } catch (error) {
    if (error instanceof ShortLinkNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    throw error;
  }
}
