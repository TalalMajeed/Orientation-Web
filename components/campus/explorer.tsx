"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { categories, landmarks } from "@/components/campus/landmarks";

const MapView = dynamic(() => import("@/components/campus/view"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-cream">
      <span className="font-italic text-sm italic text-ink/40">Loading map…</span>
    </div>
  ),
});

export default function CampusExplorer({
  className = "",
  mapClassName = "h-[540px]",
}: {
  className?: string;
  mapClassName?: string;
}) {
  const [active, setActive] = useState("all");
  const visible = useMemo(
    () => (active === "all" ? landmarks : landmarks.filter((l) => l.category === active)),
    [active]
  );

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActive(category.id)}
            className={`flex cursor-pointer items-center gap-2 rounded-full border-2 border-dotted px-4 py-1.5 font-italic text-sm italic transition-colors ${
              active === category.id
                ? "border-transparent bg-fg text-surface"
                : "border-fg/40 text-fg hover:border-fg"
            }`}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: category.color }} />
            {category.name}
          </button>
        ))}
      </div>

      <div
        className={`mt-4 overflow-hidden rounded-[30px] border border-dashed border-fg/40 ${mapClassName}`}
      >
        <MapView landmarks={visible} />
      </div>
    </div>
  );
}
