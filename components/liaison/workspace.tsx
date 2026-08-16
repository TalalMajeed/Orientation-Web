"use client";

import AllocationView from "@/components/liaison/allocation";
import HousesView from "@/components/liaison/houses";
import Overview from "@/components/liaison/overview";
import StudentsView from "@/components/liaison/students";
import { useLiaison } from "@/components/liaison/store";

export type TabId = "overview" | "houses" | "students" | "allocation";

export default function Workspace({ tab }: { tab: TabId }) {
  const { loaded, busy, error } = useLiaison();

  if (!loaded) {
    return (
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg/50">
        Loading workspace…
      </p>
    );
  }

  return (
    <>
      {error && (
        <p
          role="alert"
          className="mb-6 rounded-2xl border border-ember/40 bg-ember/5 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.12em] text-ember"
        >
          {error}
        </p>
      )}

      <div className={busy ? "pointer-events-none opacity-60 transition-opacity" : undefined}>
        {tab === "overview" && <Overview />}
        {tab === "houses" && <HousesView />}
        {tab === "students" && <StudentsView />}
        {tab === "allocation" && <AllocationView />}
      </div>
    </>
  );
}
