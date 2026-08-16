"use client";

import { useEffect, useState } from "react";
import { useLiaison } from "./store";

const field =
  "rounded-md border border-fg/20 bg-transparent px-2 py-1 font-mono text-[12px] text-fg focus:border-fg focus:outline-none";

/**
 * Names are edited locally and saved on blur or Enter. Saving per keystroke
 * would be one request per character — enough to trip the API rate limit while
 * someone types a name, and to leave the field fighting the response.
 */
function NameInput({
  value,
  onCommit,
  className = "",
}: {
  value: string;
  onCommit: (next: string) => void;
  className?: string;
}) {
  const [draft, setDraft] = useState(value);

  // The server is the source of truth: adopt its value whenever it changes
  // underneath (a reseed, or another operator's edit arriving on refetch).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync the draft when the saved value changes
    setDraft(value);
  }, [value]);

  const commit = () => {
    if (draft !== value) {
      onCommit(draft);
    }
  };

  return (
    <input
      className={`${field} ${className}`}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") setDraft(value);
      }}
    />
  );
}

export default function HousesView() {
  const { houses, students, updateHouse, updateOG } = useLiaison();
  const [open, setOpen] = useState<string | null>(houses[0]?.id ?? null);

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
                    <NameInput
                      className="flex-1"
                      value={h.ol}
                      onCommit={(ol) => updateHouse(h.id, { ol })}
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
                          <NameInput
                            className="mt-1.5 w-full"
                            value={og.name}
                            onCommit={(name) => updateOG(h.id, og.id, name)}
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
