import "server-only";

import { ensureHuntIndexes, huntScansCollection } from "./db";
import { HUNT_HOUSES } from "./houses";
import type { LeaderboardDto } from "./types";

const RECENT_LIMIT = 12;

export async function getLeaderboard(): Promise<LeaderboardDto> {
  await ensureHuntIndexes();

  const scans = await huntScansCollection();

  const [counts, recentDocs] = await Promise.all([
    scans
      .aggregate<{ _id: string; points: number }>([
        { $group: { _id: "$houseId", points: { $sum: 1 } } },
      ])
      .toArray(),
    scans.find().sort({ scannedAt: -1 }).limit(RECENT_LIMIT).toArray(),
  ]);

  const pointsByHouse = new Map(counts.map((c) => [c._id, c.points]));

  // Every house appears even with zero points, so the board never looks like
  // it is missing a team.
  const board = HUNT_HOUSES.map((house) => ({
    houseId: house.id,
    houseName: house.name,
    color: house.color,
    points: pointsByHouse.get(house.id) ?? 0,
  })).sort((a, b) => b.points - a.points);

  const houseColor = new Map(HUNT_HOUSES.map((h) => [h.id, h.color]));

  return {
    board,
    totalCaptures: counts.reduce((sum, c) => sum + c.points, 0),
    recent: recentDocs.map((d) => ({
      houseName: d.houseName,
      color: houseColor.get(d.houseId) ?? "#888888",
      scannedAt: d.scannedAt.toISOString(),
    })),
  };
}
