"use client";

import { useEffect, useState } from "react";
import { useLiaison } from "./store";
import { downloadRows, makeDemoStudents } from "./logic";
import type { Student } from "./types";

export default function AllocationView() {
  const {
    students,
    houses,
    config,
    allocated,
    runAllocation,
    loadDemoAndAllocate,
    resetAllocation,
    setConfig,
  } = useLiaison();
  const [openHouse, setOpenHouse] = useState<string | null>(null);
  const [demoCount, setDemoCount] = useState(300);
  const [capDraft, setCapDraft] = useState(
    config.houseCapacity === null ? "" : String(config.houseCapacity)
  );

  // The cap now costs a request, so it saves on blur rather than per keystroke.
  // Empty means "no cap"; anything below 1 is not a cap the server accepts.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- adopt the saved value
    setCapDraft(config.houseCapacity === null ? "" : String(config.houseCapacity));
  }, [config.houseCapacity]);

  const commitCap = () => {
    const trimmed = capDraft.trim();
    const next = trimmed === "" ? null : Math.max(1, Math.floor(Number(trimmed) || 0));

    if (next !== config.houseCapacity) {
      void setConfig({ houseCapacity: next });
    }
  };

  const houseName = (id: string | null) => houses.find((h) => h.id === id)?.name ?? "—";
  const ogLabel = (s: Student) => {
    const h = houses.find((x) => x.id === s.houseId);
    const og = h?.ogs.find((o) => o.id === s.ogId);
    return og ? `${h!.name} ${og.group}` : "—";
  };
  const rowsFull = (list: Student[]) =>
    list.map((s) => ({
      Name: s.name,
      "CMS ID": s.cmsId,
      Department: s.department,
      Gender: s.gender,
      Merit: s.merit,
      House: houseName(s.houseId),
      Group: ogLabel(s),
    }));

  const pill = "rounded-full border-2 border-dotted px-5 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors";
  const solid = "border-transparent bg-fg text-surface hover:bg-ember hover:text-cream";
  const ghost = "border-fg/40 text-fg hover:border-fg";
  const allocatedCount = students.filter((s) => s.houseId).length;
  const unassigned = students.filter((s) => !s.houseId);

  return (
    <div>
      <h2 className="font-serif text-5xl font-bold text-fg">Allocation</h2>
      <p className="mt-3 max-w-2xl font-mono text-[12px] uppercase leading-relaxed tracking-[0.08em] text-fg/50">
        One click splits the whole batch across every house — balanced by gender and spread
        evenly across schools — then divides each house across its OG groups the same way.
        Each student lands in exactly one house and one group.
      </p>

      {/* One-click divide */}
      <div className="mt-6 rounded-2xl border border-fg/12 bg-fg/[0.02] p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg/40">
          Divide the batch
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            onClick={runAllocation}
            disabled={students.length === 0}
            className="rounded-full border-2 border-transparent bg-ember px-7 py-3 font-mono text-[12px] uppercase tracking-[0.16em] text-cream transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Auto-divide batch
          </button>
          <button onClick={resetAllocation} disabled={!allocated} className={`${pill} ${ghost} disabled:opacity-40`}>
            Reset
          </button>
          <label className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.1em] text-fg/60">
            House cap
            <input
              type="number"
              min={1}
              placeholder="auto"
              value={capDraft}
              onChange={(e) => setCapDraft(e.target.value)}
              onBlur={commitCap}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              className="no-spinner w-20 rounded-md border border-fg/25 bg-transparent px-2 py-1 text-fg focus:border-fg focus:outline-none"
            />
          </label>
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-fg/50">
            {allocatedCount} / {students.length} allocated
          </span>
        </div>

        {/* Dummy data — generate a batch and divide it in one go */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-dashed border-fg/15 pt-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg/40">
            No data? Try dummy:
          </span>
          <span className="flex items-center gap-1.5 rounded-full border-2 border-dotted border-fg/40 py-0.5 pl-4 pr-1">
            <input
              type="number"
              min={1}
              max={5000}
              value={demoCount}
              onChange={(e) => setDemoCount(Math.max(1, Math.min(5000, Number(e.target.value) || 0)))}
              className="no-spinner w-14 bg-transparent font-mono text-[11px] text-fg focus:outline-none"
              aria-label="Number of dummy students"
            />
            <button
              onClick={() => loadDemoAndAllocate(makeDemoStudents(demoCount))}
              className="rounded-full bg-fg px-3 py-1 font-mono text-[11px] uppercase tracking-[0.12em] text-surface transition-colors hover:bg-ember hover:text-cream"
            >
              Load & divide
            </button>
          </span>
        </div>
      </div>

      {/* Exports */}
      {allocated && (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="self-center font-mono text-[10px] uppercase tracking-[0.16em] text-fg/40">Export:</span>
          <button onClick={() => downloadRows(rowsFull(students), "allocation-full.csv")} className={`${pill} ${ghost}`}>
            Full allocation
          </button>
          <button
            onClick={() => downloadRows(rowsFull([...students].sort((a, b) => a.department.localeCompare(b.department))), "allocation-by-department.csv")}
            className={`${pill} ${ghost}`}
          >
            By school
          </button>
          <button
            onClick={() => downloadRows(rowsFull([...students].sort((a, b) => a.gender.localeCompare(b.gender))), "allocation-by-gender.csv")}
            className={`${pill} ${ghost}`}
          >
            By gender
          </button>
        </div>
      )}

      {/* Distribution — click a house to see every name assigned to it */}
      <div className="mt-8 space-y-2">
        {houses.map((h) => {
          const members = students.filter((s) => s.houseId === h.id);
          const m = members.filter((s) => s.gender === "male").length;
          const f = members.filter((s) => s.gender === "female").length;
          const isOpen = openHouse === h.id;
          return (
            <div key={h.id} className="overflow-hidden rounded-2xl border border-fg/12">
              <button
                onClick={() => setOpenHouse(isOpen ? null : h.id)}
                className="flex w-full items-center gap-4 px-5 py-4 transition-colors hover:bg-fg/[0.03]"
              >
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: h.color }} />
                <span className="text-left font-serif text-2xl font-bold text-fg">{h.name}</span>
                {h.ol && (
                  <span className="hidden font-mono text-[10px] uppercase tracking-[0.12em] text-fg/40 sm:inline">
                    {h.ol}
                  </span>
                )}
                <span className="ml-auto font-mono text-[11px] uppercase tracking-[0.12em] text-fg/60">
                  {members.length} · <span className="text-sky">{m}M</span> / <span className="text-ember">{f}F</span>
                </span>
                <span className="font-mono text-[11px] text-fg/40">{isOpen ? "▲" : "▼"}</span>
              </button>

              {isOpen && (
                <div className="space-y-4 border-t border-fg/10 px-5 py-4">
                  {members.length === 0 && (
                    <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-fg/40">
                      No students assigned yet — run Auto-divide.
                    </p>
                  )}
                  {members.length > 0 &&
                    h.ogs.map((og) => {
                      const gm = members.filter((s) => s.ogId === og.id);
                      const gmm = gm.filter((s) => s.gender === "male").length;
                      const gmf = gm.filter((s) => s.gender === "female").length;
                      return (
                        <div key={og.id}>
                          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                            <span className="font-serif text-lg font-bold text-fg">
                              {h.name} {og.group}
                            </span>
                            {og.name && (
                              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-fg/40">
                                {og.name}
                              </span>
                            )}
                            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-fg/50">
                              {gm.length} · <span className="text-sky">{gmm}M</span>/<span className="text-ember">{gmf}F</span>
                            </span>
                          </div>
                          <div className="mt-2 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                            {gm.map((s) => (
                              <div
                                key={s.id}
                                className="flex items-center gap-2 rounded-lg border border-fg/10 px-3 py-1.5"
                              >
                                <span
                                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${s.gender === "male" ? "bg-sky" : "bg-ember"}`}
                                />
                                <span className="truncate font-sans text-[13px] text-fg">{s.name}</span>
                                <span className="ml-auto shrink-0 font-mono text-[10px] uppercase tracking-[0.08em] text-fg/45">
                                  {s.department} · {s.cmsId}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Anyone the allocator could not place (e.g. house cap reached) */}
      {allocated && unassigned.length > 0 && (
        <div className="mt-4 rounded-2xl border border-dashed border-ember/50 bg-ember/[0.06] p-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ember">
            {unassigned.length} unassigned — raise or clear the house cap and re-divide.
          </p>
        </div>
      )}
    </div>
  );
}
