import { NextRequest, NextResponse } from "next/server";

import { getCodeStatus, redeemCode } from "@/services/hunt/redeem";

type RouteContext = { params: Promise<{ code: string }> };

// Public — this is exactly what a student's phone hits after scanning the QR.
// No staff session involved; the only "auth" is having physically found the
// code, same as an event ticket's QR.

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { code } = await params;
  const status = await getCodeStatus(code.trim().toUpperCase());

  return NextResponse.json(status, { status: 200 });
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { code } = await params;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const houseId =
    typeof body === "object" && body !== null && typeof (body as { houseId?: unknown }).houseId === "string"
      ? (body as { houseId: string }).houseId
      : null;

  if (!houseId) {
    return NextResponse.json({ error: "A house is required" }, { status: 400 });
  }

  const result = await redeemCode(code.trim().toUpperCase(), houseId);

  if (result.result === "invalid_house") {
    return NextResponse.json({ error: "Unknown house" }, { status: 400 });
  }

  if (result.result === "not_found") {
    return NextResponse.json({ error: "Code not found" }, { status: 404 });
  }

  return NextResponse.json(result, { status: 200 });
}
