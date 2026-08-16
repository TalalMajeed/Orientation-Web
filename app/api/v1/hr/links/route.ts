import { NextRequest, NextResponse } from "next/server";

import { readJson, readString } from "@/lib/request";
import { requireRole } from "@/services/auth/guard";
import { InvalidUrlError, createShortLink, listShortLinks } from "@/services/hr/links";

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

  const body = await readJson(request);

  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const url = readString(body, "url");

  if (!url) {
    return NextResponse.json({ error: "A URL is required" }, { status: 400 });
  }

  try {
    const link = await createShortLink(url);

    return NextResponse.json({ link }, { status: 201 });
  } catch (error) {
    if (error instanceof InvalidUrlError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    throw error;
  }
}
