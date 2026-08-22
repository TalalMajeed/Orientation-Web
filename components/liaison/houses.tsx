"use client";

import { useEffect, useState } from "react";
import { useLiaison } from "@/components/liaison/store";

const FIELD =
  "rounded-md border border-fg/20 bg-transparent px-2 py-1 font-mono text-[12px] text-fg focus:border-fg focus:outline-none";

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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(value);
  }, [value]);

  const commit = () => {
    if (draft !== value) {
      onCommit(draft);
    }
  };

  return (
    <input
      className={`${FIELD} ${className}`}
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
        if (event.key === "Escape") setDraft(value);
      }}
    />
  );
}

export default function HousesView() {
  const { houses, students, updateHouse, updateOg } = useLiaison();
  const [open, setOpen] = useState<string | null>(houses[0]?.id ?? null);

  return (
    <div>
      <h2 className="font-serif text-5xl font-bold text-fg">OG Houses</h2>
      <p className="mt-3 max-w-xl font-mono text-[12px] uppercase leading-relaxed tracking-[0.08em] text-fg/50">
        Nine houses, each led by an OL and split into OG groups (e.g. Vikings&nbsp;1–7). Edit names
        inline. Member counts appear after allocation.
      </p>

      <div className="mt-8 space-y-3">
        {houses.map((house) => {
          const members = students.filter((student) => student.houseId === house.id);
          const male = members.filter((student) => student.gender === "male").length;
          const female = members.filter((student) => student.gender === "female").length;
          const isOpen = open === house.id;

          return (
            <div key={house.id} className="overflow-hidden rounded-2xl border border-fg/12">
              <button
                onClick={() => setOpen(isOpen ? null : house.id)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full" style={{ background: house.color }} />
                  <span className="font-serif text-2xl font-bold text-fg">{house.name}</span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-fg/45">
                    {house.ogs.length} OGs
                  </span>
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-fg/60">
                  {members.length} · <span className="text-sky">{male}M</span> /{" "}
                  <span className="text-ember">{female}F</span>
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
                      value={house.ol}
                      onCommit={(ol) => updateHouse(house.id, { ol })}
                    />
                  </label>

                  <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {house.ogs.map((og) => {
                      const groupMembers = members.filter((student) => student.ogId === og.id);

                      return (
                        <div key={og.id} className="rounded-xl border border-fg/12 p-3">
                          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-fg/45">
                            {house.name} {og.group}
                            {groupMembers.length > 0 && (
                              <span className="ml-2 text-fg/60">· {groupMembers.length}</span>
                            )}
                          </p>
                          <NameInput
                            className="mt-1.5 w-full"
                            value={og.name}
                            onCommit={(name) => updateOg(house.id, og.id, name)}
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
