"use client";

import { useState } from "react";
import DecorEllipse from "./DecorEllipse";

type Ev = { time: string; title: string; location?: string; note?: string };
type Day = { id: number; tab: string; date: string; events: Ev[] };

const days: Day[] = [
  {
    id: 1,
    tab: "Day 01",
    date: "September 2026",
    events: [
      { time: "TBD", title: "Reception at Schools", location: "TBD" },
      { time: "TBD", title: "Opening & Q/A with Parents", location: "TBD" },
      { time: "TBD", title: "Principal Address + Q/A", location: "TBD" },
      { time: "TBD", title: "Meet Your OGs", location: "TBD" },
      { time: "TBD", title: "Batch Photo", location: "TBD" },
    ],
  },
  {
    id: 2,
    tab: "Day 02",
    date: "September 2026",
    events: [
      { time: "TBD", title: "Reception at Schools", location: "TBD" },
      { time: "TBD", title: "Art-Based OG Activities + Societies", location: "TBD" },
      { time: "TBD", title: "ON Fest + Society Stalls", location: "TBD" },
    ],
  },
  {
    id: 3,
    tab: "Day 03",
    date: "September 2026",
    events: [
      { time: "TBD", title: "Life at NUST", location: "TBD", note: "Featuring NUST alumni testimonials" },
      { time: "TBD", title: "Drama by NDC", location: "TBD" },
      { time: "TBD", title: "Closing Ceremony", location: "TBD" },
    ],
  },
];

export default function DwSchedule() {
  const [active, setActive] = useState(1);
  const day = days.find((d) => d.id === active)!;

  const pill = (on: boolean) =>
    `rounded-full border-2 border-dotted px-5 py-1.5 font-italic italic text-sm transition-colors ${
      on ? "border-transparent bg-fg text-surface" : "border-fg/50 text-fg hover:border-fg"
    }`;

  return (
    <section id="schedule" className="relative overflow-hidden bg-surface px-6 py-28 sm:px-10">
      <DecorEllipse className="dw-spin pointer-events-none absolute right-[-12%] top-[20%] h-[65%] w-[55%] text-fg/15" />
      <div className="relative mx-auto max-w-[1600px]">
        <p className="font-italic text-sm italic text-fg/50">— Orientation Week</p>
        <div className="mt-4 flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
          <div>
            <h2 className="font-serif font-bold text-[16vw] leading-[0.85] text-fg lg:text-[11vw]">
              The Schedule
            </h2>
            <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-dotted border-fg/40 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-fg/60">
              Coming soon — dates &amp; timings not yet finalized
            </span>
          </div>
          <div className="flex gap-2">
            {days.map((d) => (
              <button key={d.id} onClick={() => setActive(d.id)} className={pill(active === d.id)}>
                {d.tab}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12 overflow-hidden rounded-[30px] border border-dashed border-fg/40">
          <div className="flex items-center justify-between border-b border-dashed border-fg/25 px-6 py-4 sm:px-10">
            <span className="font-italic italic text-fg">{day.tab}</span>
            <span className="font-italic text-sm italic text-fg/50">{day.date}</span>
          </div>
          {day.events.map((e, i) => (
            <div
              key={i}
              className="group grid grid-cols-1 gap-2 border-b border-dashed border-fg/15 px-6 py-6 transition-colors last:border-0 hover:bg-fg/[0.03] sm:grid-cols-[180px_1fr] sm:gap-8 sm:px-10"
            >
              <span className="font-italic text-sm italic tabular-nums text-ember">{e.time}</span>
              <div>
                <h3 className="font-serif text-3xl leading-none text-fg sm:text-4xl">{e.title}</h3>
                {e.note && <p className="mt-2 font-sans text-sm text-fg/50">{e.note}</p>}
                {e.location && (
                  <p className="mt-1 font-italic text-sm italic text-fg/55">{e.location}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
