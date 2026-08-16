"use client";

import Overview from "./Overview";
import HousesView from "./HousesView";
import StudentsView from "./StudentsView";
import AllocationView from "./AllocationView";
import { useLiaison } from "./store";

export type TabId = "overview" | "houses" | "students" | "allocation";

/**
 * The workspace now lives on the server, so it has two states the localStorage
 * version never had: not loaded yet, and a write that failed. Both are shown
 * here rather than in each view — a silent failure would leave someone
 * believing an edit was saved when it was not.
 */
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
