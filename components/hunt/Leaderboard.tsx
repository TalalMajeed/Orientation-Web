"use client";

import { useCallback, useEffect, useState } from "react";

import DecorEllipse from "@/components/website/dw/DecorEllipse";
import PixelMascot from "./PixelMascot";

interface LeaderboardEntry {
  houseId: string;
  houseName: string;
  color: string;
  points: number;
}

interface LeaderboardActivity {
  houseName: string;
  color: string;
  scannedAt: string;
}

interface LeaderboardData {
  board: LeaderboardEntry[];
  totalCaptures: number;
  recent: LeaderboardActivity[];
}

const REFRESH_MS = 5_000;
const RANK_LABEL = ["1ST", "2ND", "3RD"];

function timeAgo(iso: string): string {
  const secs = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));

  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;

  return `${Math.floor(secs / 3600)}h ago`;
}

export default function Leaderboard() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [, forceTick] = useState(0);

  const load = useCallback(async () => {
    const response = await fetch("/api/v1/hunt/leaderboard");

    if (response.ok) {
      setData(await response.json());
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount
    load();
    const interval = setInterval(load, REFRESH_MS);
    return () => clearInterval(interval);
  }, [load]);

  // Keeps "X ago" timestamps in the activity feed fresh between polls.
  useEffect(() => {
    const interval = setInterval(() => forceTick((t) => t + 1), 15_000);
    return () => clearInterval(interval);
  }, []);

  const board = data?.board ?? [];
  const leader = board[0];

  return (
    <section
      id="scavenger-hunt"
      className="relative overflow-hidden bg-surface px-6 py-28 sm:px-10"
    >
      <DecorEllipse className="dw-spin pointer-events-none absolute right-[-8%] top-[6%] h-[55%] w-[50%] text-fg/15" />

      <div className="relative mx-auto max-w-[1600px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-italic text-sm italic text-fg/50">— Find every spot</p>
            <h2 className="mt-4 font-serif font-bold text-[16vw] leading-[0.85] text-fg lg:text-[11vw]">
              Scavenger Hunt
            </h2>
          </div>
          <div className="mb-2 flex items-center gap-2 rounded-full border-2 border-dotted border-fg/40 px-4 py-1.5 font-italic text-sm italic text-fg">
            <span className="h-2 w-2 animate-pulse rounded-full bg-sky" />
            Live · {data ? `${data.totalCaptures} found` : "…"}
          </div>
        </div>

        {leader && leader.points > 0 && (
          <p className="mt-6 font-mono text-[12px] uppercase tracking-[0.1em] text-fg/60">
            <span style={{ color: leader.color }}>{leader.houseName}</span> is currently in the lead
          </p>
        )}

        {/* Ranking */}
        <div className="mt-10 space-y-2">
          {board.length === 0 && (
            <p className="rounded-[24px] border border-dashed border-fg/25 p-8 text-center font-italic text-sm italic text-fg/40">
              Waiting for the first capture…
            </p>
          )}
          {board.map((house, i) => {
            const isTop3 = i < 3;

            return (
              <div
                key={house.houseId}
                className={`flex items-center gap-4 rounded-[24px] border px-5 py-4 transition-colors sm:gap-5 sm:px-6 ${
                  isTop3 ? "border-fg/25 bg-fg/[0.03]" : "border-fg/10"
                }`}
              >
                <span
                  className={`w-10 shrink-0 font-mono text-[11px] uppercase tracking-[0.08em] ${
                    isTop3 ? "font-bold text-fg" : "text-fg/35"
                  }`}
                >
                  {isTop3 ? RANK_LABEL[i] : `#${i + 1}`}
                </span>
                <PixelMascot color={house.color} size={isTop3 ? 40 : 32} />
                <span
                  className={`flex-1 font-serif font-bold text-fg ${isTop3 ? "text-2xl sm:text-3xl" : "text-xl"}`}
                >
                  {house.houseName}
                </span>
                <span className="font-serif text-3xl font-bold tabular-nums text-fg sm:text-4xl">
                  {house.points}
                </span>
              </div>
            );
          })}
        </div>

        {/* Recent activity */}
        {data && data.recent.length > 0 && (
          <div className="mt-14">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg/40">
              Recent captures
            </p>
            <ul className="mt-4 space-y-2">
              {data.recent.map((activity, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 font-mono text-[12px] text-fg/60"
                >
                  <PixelMascot color={activity.color} size={20} />
                  <span className="text-fg">{activity.houseName}</span>
                  found a spot
                  <span className="ml-auto shrink-0 text-fg/35">{timeAgo(activity.scannedAt)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
