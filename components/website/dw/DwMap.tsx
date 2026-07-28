"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { categories, landmarks } from "../site/mapData";
import DecorEllipse from "./DecorEllipse";

const MapView = dynamic(() => import("../site/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-cream">
      <span className="font-italic text-sm italic text-ink/40">Loading map…</span>
    </div>
  ),
});

export default function DwMap() {
  const [active, setActive] = useState("all");
  const filtered = useMemo(
    () => (active === "all" ? landmarks : landmarks.filter((l) => l.category === active)),
    [active]
  );

  return (
    <section id="map" className="relative overflow-hidden bg-surface px-6 py-28 sm:px-10">
      <DecorEllipse className="dw-spin pointer-events-none absolute left-[-8%] top-[10%] h-[55%] w-[50%] text-fg/15" />
      <div className="relative mx-auto max-w-[1600px]">
        <p className="font-italic text-sm italic text-fg/50">— Find your way</p>
        <h2 className="mt-4 font-serif font-bold text-[16vw] leading-[0.85] text-fg lg:text-[11vw]">
          Campus Map
        </h2>

        <div className="mt-10 flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              className={`flex items-center gap-2 rounded-full border-2 border-dotted px-4 py-1.5 font-italic italic text-sm transition-colors ${
                active === c.id ? "border-transparent bg-fg text-surface" : "border-fg/40 text-fg hover:border-fg"
              }`}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
              {c.name}
            </button>
          ))}
        </div>

        <div className="mt-8 h-[540px] overflow-hidden rounded-[30px] border border-dashed border-fg/40">
          <MapView landmarks={filtered} />
        </div>
      </div>
    </section>
  );
}
