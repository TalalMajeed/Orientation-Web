import { NextResponse } from "next/server";

import { LiaisonValidationError } from "@/services/liaison/db";
import type { LiaisonState } from "@/services/liaison/types";

/**
 * Every liaison endpoint answers with the whole workspace. The panel has four
 * views over one state, and a mutation like allocation touches all of it — so
 * returning a partial response would only make the client refetch. One shape
 * out means the store can replace its state and never drift from the server.
 */
export function stateResponse(state: LiaisonState, status = 200) {
  return NextResponse.json({ state }, { status });
}

/** Validation failures are the caller's fault (400); everything else is ours,
 *  so it rethrows and Next logs it rather than reporting a false 400. */
export function validationError(error: unknown) {
  if (error instanceof LiaisonValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  throw error;
}
