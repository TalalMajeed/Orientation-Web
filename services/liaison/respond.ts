import { NextResponse } from "next/server";

import { LiaisonValidationError } from "@/services/liaison/db";
import type { LiaisonState } from "@/services/liaison/types";

export function stateResponse(state: LiaisonState, status = 200) {
  return NextResponse.json({ state }, { status });
}

export function validationError(error: unknown) {
  if (error instanceof LiaisonValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  throw error;
}
