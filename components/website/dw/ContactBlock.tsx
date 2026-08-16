"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import ContactForm from "./ContactForm";
import { categories, landmarks } from "../site/mapData";

const MapView = dynamic(() => import("../site/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-cream">
      <span className="font-italic text-sm italic text-ink/40">Loading map…</span>
    </div>
  ),
});

const details = [
  { label: "General", value: "info@orientation.nust.edu.pk", href: "mailto:info@orientation.nust.edu.pk" },
  { label: "Support", value: "support@orientation.nust.edu.pk", href: "mailto:support@orientation.nust.edu.pk" },
  { label: "Location", value: "NUST, H-12, Islamabad", href: null },
  { label: "Hours", value: "Mon–Sat · 9am – 5pm PKT", href: null },
];

export default function ContactBlock() {
  const [active, setActive] = useState("all");
  const filtered = useMemo(
    () => (active === "all" ? landmarks : landmarks.filter((l) => l.category === active)),
    [active]
  );

  return (
    <section className="bg-surface px-6 pb-16 pt-24 sm:px-10 sm:pt-32">
      <div className="mx-auto max-w-[1600px]">
        <p className="font-italic text-sm italic text-fg/50">— Contact &amp; Map</p>
        <h1 className="mt-4 font-serif font-bold text-[16vw] leading-[0.85] text-fg lg:text-[7vw]">
          Say hello
        </h1>

        <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Left: contact content */}
          <div className="max-w-xl">
            <p className="font-serif text-2xl leading-[1.3] text-fg sm:text-3xl">
              Questions about Orientation Week, the schedule, or your house? The
              organizing team is one message away.
            </p>
            <ContactForm />

            {/* Contact details as plain, separated cards — clearer to scan than a
                bare label/value grid, and each one is its own tap target. */}
            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {details.map((d) => (
                <div key={d.label} className="rounded-2xl border border-fg/12 p-5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg/45">
                    {d.label}
                  </p>
                  {d.href ? (
                    <a
                      href={d.href}
                      className="link-sweep mt-2 block font-serif text-lg text-fg"
                    >
                      {d.value}
                    </a>
                  ) : (
                    <p className="mt-2 font-serif text-lg text-fg">{d.value}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right: campus map */}
          <div className="lg:self-start">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg/45">
              Find your way — Campus Map
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActive(c.id)}
                  className={`flex cursor-pointer items-center gap-2 rounded-full border-2 border-dotted px-4 py-1.5 font-italic italic text-sm transition-colors ${
                    active === c.id ? "border-transparent bg-fg text-surface" : "border-fg/40 text-fg hover:border-fg"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                  {c.name}
                </button>
              ))}
            </div>

            <div className="mt-4 h-[420px] overflow-hidden rounded-[30px] border border-dashed border-fg/40 lg:h-[560px]">
              <MapView landmarks={filtered} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
