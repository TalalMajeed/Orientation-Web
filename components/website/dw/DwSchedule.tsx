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
      { time: "09:00 – 13:00", title: "Reception at Schools", location: "Respective Schools (NET Hall for SEECS)" },
      { time: "10:00 – 11:30", title: "Opening & Q/A with Parents", location: "Jinnah Auditorium" },
      { time: "11:30 – 13:00", title: "Principal S3H Address + Q/A", location: "Jinnah Auditorium" },
      { time: "14:00 – 16:00", title: "Meet Your OGs", location: "Helipad Ground" },
      { time: "16:00 – 20:30", title: "Batch Photo", location: "Convocation Ground" },
    ],
  },
  {
    id: 2,
    tab: "Day 02",
    date: "September 2026",
    events: [
      { time: "09:00 – 13:00", title: "Reception at Schools", location: "Respective Schools" },
      { time: "14:00 – 17:00", title: "Art-Based OG Activities + Societies", location: "All over NUST / Helipad Ground" },
      { time: "17:00 – 22:00", title: "ON Fest + Society Stalls", location: "SCME Ground" },
    ],
  },
  {
    id: 3,
    tab: "Day 03",
    date: "September 2026",
    events: [
      { time: "09:00 – 13:00", title: "Life at NUST", location: "Jinnah Auditorium", note: "Featuring NUST alumni testimonials" },
      { time: "14:00 – 17:00", title: "Drama by NDC", location: "Jinnah Auditorium" },
      { time: "17:00 – 19:00", title: "Closing Ceremony", location: "Jinnah Auditorium" },
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
          <h2 className="font-serif font-bold text-[16vw] leading-[0.85] text-fg lg:text-[11vw]">
            The Schedule
          </h2>
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
