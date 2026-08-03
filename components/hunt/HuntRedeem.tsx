"use client";

import { useCallback, useEffect, useState } from "react";

import { HUNT_HOUSES } from "@/services/hunt/houses";

type Phase = "loading" | "not_found" | "cooldown" | "available" | "captured" | "error";

function countdown(availableAt: string): string {
  const ms = new Date(availableAt).getTime() - Date.now();

  if (ms <= 0) return "any moment now";

  const mins = Math.floor(ms / 60_000);
  const secs = Math.floor((ms % 60_000) / 1000);

  return `${mins}m ${secs.toString().padStart(2, "0")}s`;
}

export default function HuntRedeem({ code }: { code: string }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [availableAt, setAvailableAt] = useState<string | null>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [houseName, setHouseName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [, forceTick] = useState(0);

  const checkStatus = useCallback(async () => {
    const response = await fetch(`/api/v1/hunt/redeem/${code}`);
    const data = await response.json().catch(() => ({}));

    if (data.status === "not_found") {
      setPhase("not_found");
      return;
    }

    setLabel(data.label ?? null);

    if (data.status === "cooldown") {
      setAvailableAt(data.availableAt);
      setPhase("cooldown");
      return;
    }

    setPhase("available");
  }, [code]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial status check on mount
    checkStatus();
  }, [checkStatus]);

  // Live countdown while on cooldown, then flip to available automatically.
  useEffect(() => {
    if (phase !== "cooldown" || !availableAt) return;

    const interval = setInterval(() => {
      if (new Date(availableAt).getTime() <= Date.now()) {
        setPhase("available");
      } else {
        forceTick((t) => t + 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, availableAt]);

  async function capture(houseId: string, name: string) {
    setSubmitting(houseId);

    try {
      const response = await fetch(`/api/v1/hunt/redeem/${code}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ houseId }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 404) {
        setPhase("not_found");
        return;
      }

      if (data.result === "cooldown") {
        // Someone else just captured it in the race between page-load and tap.
        setAvailableAt(data.availableAt);
        setPhase("cooldown");
        return;
      }

      if (data.result === "captured") {
        setHouseName(name);
        setPhase("captured");
        return;
      }

      setPhase("error");
    } catch {
      setPhase("error");
    } finally {
      setSubmitting(null);
    }
  }

  // Top-aligned, not vertically centered — the "available" phase can render
  // 10 house buttons, which would push the heading off-screen above a short
  // phone viewport if this were centered instead.
  const shell = (children: React.ReactNode) => (
    <main className="flex min-h-screen w-full justify-center bg-surface px-6 py-12 text-fg">
      <div className="w-full max-w-sm text-center">
        <p className="font-italic text-sm italic text-fg/50">— NUST Orientation &apos;26</p>
        <h1 className="mt-2 font-serif text-5xl font-bold leading-none text-fg">Scavenger Hunt</h1>
        {children}
      </div>
    </main>
  );

  if (phase === "loading") {
    return shell(
      <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.14em] text-fg/50">Checking code…</p>
    );
  }

  if (phase === "not_found") {
    return shell(
      <div className="mt-8 rounded-2xl border border-dashed border-ember/50 bg-ember/[0.06] p-6">
        <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-ember">Code not found</p>
        <p className="mt-2 font-mono text-[11px] leading-relaxed text-fg/60">
          This QR doesn&apos;t match a live hunt code. Ask a Hunt team member if you think that&apos;s wrong.
        </p>
      </div>
    );
  }

  if (phase === "error") {
    return shell(
      <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.1em] text-ember">
        Something went wrong. Try scanning again.
      </p>
    );
  }

  if (phase === "cooldown") {
    return shell(
      <>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-fg/50">
          {label ?? "This spot"}
        </p>
        <div className="mt-8 rounded-2xl border border-dashed border-fg/25 p-6">
          <p className="font-serif text-2xl font-bold text-fg">Already found!</p>
          <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.08em] text-fg/50">
            Available again in
          </p>
          <p className="mt-1 font-mono text-3xl font-bold tabular-nums text-ember">
            {availableAt ? countdown(availableAt) : "—"}
          </p>
        </div>
      </>
    );
  }

  if (phase === "captured") {
    return shell(
      <div className="mt-8 rounded-2xl border border-sky/40 bg-sky/10 p-6">
        <p className="font-serif text-3xl font-bold text-fg">Captured! ✓</p>
        <p className="mt-3 font-mono text-[13px] uppercase tracking-[0.1em] text-fg">
          +1 point for <span className="text-sky">{houseName}</span>
        </p>
        <p className="mt-3 font-mono text-[11px] leading-relaxed text-fg/50">
          This spot is on cooldown for 30 minutes now — go find the next one!
        </p>
      </div>
    );
  }

  // available
  return shell(
    <>
      <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-fg/50">
        {label ?? "You found it!"}
      </p>
      <p className="mt-6 font-mono text-[12px] uppercase leading-relaxed tracking-[0.08em] text-fg/60">
        Which house are you repping?
      </p>
      <div className="mt-5 grid grid-cols-2 gap-2">
        {HUNT_HOUSES.map((house) => (
          <button
            key={house.id}
            onClick={() => capture(house.id, house.name)}
            disabled={submitting !== null}
            className="flex items-center gap-2 rounded-full border-2 border-dotted border-fg/30 px-4 py-3 text-left font-mono text-[12px] uppercase tracking-[0.06em] text-fg transition-colors hover:border-fg disabled:opacity-50"
          >
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: house.color }} />
            {submitting === house.id ? "…" : house.name}
          </button>
        ))}
      </div>
    </>
  );
}
