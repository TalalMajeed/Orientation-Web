"use client";

import { useLiaison } from "./store";

export default function Overview() {
  const { students, houses } = useLiaison();
  const total = students.length;
  const male = students.filter((s) => s.gender === "male").length;
  const female = students.filter((s) => s.gender === "female").length;
  const allocated = students.filter((s) => s.houseId).length;
  const ogCount = houses.reduce((n, h) => n + h.ogs.length, 0);

  const stats = [
    { label: "Students", value: total },
    { label: "Male", value: male },
    { label: "Female", value: female },
    { label: "OG Houses", value: houses.length },
    { label: "OGs / Groups", value: ogCount },
    { label: "Allocated", value: allocated },
    { label: "Unallocated", value: total - allocated },
    { label: "Capacity/House", value: Math.ceil((total || 0) / (houses.length || 1)) },
  ];

  return (
    <div>
      <h2 className="font-serif text-5xl font-bold text-fg">Overview</h2>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-fg/12 p-5">
            <p className="font-serif text-4xl font-bold text-fg">{s.value}</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-fg/50">
              {s.label}
            </p>
          </div>
        ))}
      </div>
      {total === 0 && (
        <p className="mt-8 font-mono text-[12px] uppercase tracking-[0.1em] text-fg/50">
          No batch loaded yet — open the <span className="text-ember">Students</span> tab to upload the
          merit list, then run allocation.
        </p>
      )}
    </div>
  );
}
