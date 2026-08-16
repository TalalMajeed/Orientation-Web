import { NextRequest, NextResponse } from "next/server";

import { readJson, readString } from "@/lib/request";
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
  const body = await readJson(request);

  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const url = readString(body, "url");

  if (!url) {
    return NextResponse.json({ error: "A URL is required" }, { status: 400 });
  }

  try {
    const link = await updateShortLink(shortId, url);

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
