"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLiaison } from "@/components/liaison/store";
import Workspace, { type TabId } from "@/components/liaison/workspace";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "houses", label: "OG Houses" },
  { id: "students", label: "Students" },
  { id: "allocation", label: "Allocation" },
  { id: "emails", label: "Emails" },
  { id: "accounts", label: "Accounts" },
];

export default function LiaisonShell() {
  const router = useRouter();
  const { canWrite, canManageAccounts, username } = useLiaison();
  const [tab, setTab] = useState<TabId>("overview");

  const tabs = TABS.filter((entry) => entry.id !== "accounts" || canManageAccounts);

  const signOut = async () => {
    await fetch("/api/v1/auth/login", { method: "DELETE" });
    router.replace("/login?next=/liaison");
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-surface text-fg">
      <header className="sticky top-0 z-30 border-b border-fg/10 bg-surface/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 sm:px-10">
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-2xl font-bold text-fg">Liaison</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-fg/45">
              Orientation &apos;26
            </span>
            {!canWrite && (
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ember">
                {username ? `${username} · ` : ""}emails only
              </span>
            )}
          </div>
          <button
            onClick={signOut}
            className="rounded-full border-2 border-dotted border-fg/40 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-fg transition-colors hover:border-fg"
          >
            Log out
          </button>
        </div>
        <div className="mx-auto flex max-w-[1400px] gap-2 overflow-x-auto px-6 pb-3 sm:px-10">
          {tabs.map((entry) => (
            <button
              key={entry.id}
              onClick={() => setTab(entry.id)}
              className={`shrink-0 rounded-full border-2 border-dotted px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors ${
                tab === entry.id
                  ? "border-transparent bg-fg text-surface"
                  : "border-fg/40 text-fg hover:border-fg"
              }`}
            >
              {entry.label}
            </button>
          ))}
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-6 py-10 sm:px-10">
        <Workspace tab={tab} />
      </div>
    </main>
  );
}
