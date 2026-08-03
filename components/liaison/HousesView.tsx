"use client";

import { useState } from "react";
import { useLiaison } from "./store";

export default function HousesView() {
  const { houses, students, updateHouse, updateOG } = useLiaison();
  const [open, setOpen] = useState<string | null>(houses[0]?.id ?? null);

  const field =
    "rounded-md border border-fg/20 bg-transparent px-2 py-1 font-mono text-[12px] text-fg focus:border-fg focus:outline-none";

  return (
    <div>
      <h2 className="font-serif text-5xl font-bold text-fg">OG Houses</h2>
      <p className="mt-3 max-w-xl font-mono text-[12px] uppercase leading-relaxed tracking-[0.08em] text-fg/50">
        Ten houses, each led by an OL and split into OG groups (e.g. Vikings&nbsp;1–9). Edit names
        inline. Member counts appear after allocation.
      </p>

      <div className="mt-8 space-y-3">
        {houses.map((h) => {
          const members = students.filter((s) => s.houseId === h.id);
          const m = members.filter((s) => s.gender === "male").length;
          const f = members.filter((s) => s.gender === "female").length;
          const isOpen = open === h.id;
          return (
            <div key={h.id} className="overflow-hidden rounded-2xl border border-fg/12">
              <button
                onClick={() => setOpen(isOpen ? null : h.id)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full" style={{ background: h.color }} />
                  <span className="font-serif text-2xl font-bold text-fg">{h.name}</span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-fg/45">
                    {h.ogs.length} OGs
                  </span>
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-fg/60">
                  {members.length} · <span className="text-sky">{m}M</span> /{" "}
                  <span className="text-ember">{f}F</span>
                </span>
              </button>

              {isOpen && (
                <div className="border-t border-fg/10 px-5 py-5">
                  <label className="flex items-center gap-3">
                    <span className="w-28 font-mono text-[10px] uppercase tracking-[0.16em] text-fg/45">
                      OL (Head)
                    </span>
                    <input
                      className={`${field} flex-1`}
                      value={h.ol}
                      onChange={(e) => updateHouse(h.id, { ol: e.target.value })}
                    />
                  </label>

                  <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {h.ogs.map((og) => {
                      const gm = members.filter((s) => s.ogId === og.id);
                      return (
                        <div key={og.id} className="rounded-xl border border-fg/12 p-3">
                          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-fg/45">
                            {h.name} {og.group}
                            {gm.length > 0 && <span className="ml-2 text-fg/60">· {gm.length}</span>}
                          </p>
                          <input
                            className={`${field} mt-1.5 w-full`}
                            value={og.name}
                            onChange={(e) => updateOG(h.id, og.id, e.target.value)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
