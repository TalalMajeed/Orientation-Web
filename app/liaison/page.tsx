"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthed, logout } from "@/components/liaison/auth";
import { LiaisonProvider } from "@/components/liaison/store";
import Overview from "@/components/liaison/Overview";
import HousesView from "@/components/liaison/HousesView";
import StudentsView from "@/components/liaison/StudentsView";
import AllocationView from "@/components/liaison/AllocationView";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "houses", label: "OG Houses" },
  { id: "students", label: "Students" },
  { id: "allocation", label: "Allocation" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function LiaisonDashboard() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<TabId>("overview");

  useEffect(() => {
    if (!isAuthed()) router.replace("/liaison/login");
    else setReady(true);
  }, [router]);

  if (!ready) return <main className="min-h-screen bg-surface" />;

  return (
    <LiaisonProvider>
      <main className="min-h-screen bg-surface text-fg">
        <header className="sticky top-0 z-30 border-b border-fg/10 bg-surface/85 backdrop-blur-md">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 sm:px-10">
            <div className="flex items-baseline gap-3">
              <span className="font-serif text-2xl font-bold text-fg">Liaison</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-fg/45">
                Orientation &apos;26
              </span>
            </div>
            <button
              onClick={() => {
                logout();
                router.replace("/liaison/login");
              }}
              className="rounded-full border-2 border-dotted border-fg/40 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-fg transition-colors hover:border-fg"
            >
              Log out
            </button>
          </div>
          <div className="mx-auto flex max-w-[1400px] gap-2 overflow-x-auto px-6 pb-3 sm:px-10">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`shrink-0 rounded-full border-2 border-dotted px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors ${
                  tab === t.id ? "border-transparent bg-fg text-surface" : "border-fg/40 text-fg hover:border-fg"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </header>

        <div className="mx-auto max-w-[1400px] px-6 py-10 sm:px-10">
          {tab === "overview" && <Overview />}
          {tab === "houses" && <HousesView />}
          {tab === "students" && <StudentsView />}
          {tab === "allocation" && <AllocationView />}
        </div>
      </main>
    </LiaisonProvider>
  );
}
