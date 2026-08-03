import { NextResponse } from "next/server";

import { getLeaderboard } from "@/services/hunt/leaderboard";

// Public — this is the page anyone can watch during the event.
export async function GET() {
  const leaderboard = await getLeaderboard();

  return NextResponse.json(leaderboard, { status: 200 });
}
