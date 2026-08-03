"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const navLinks = [
  { href: "/schedule", label: "Schedule" },
  { href: "/map", label: "Map" },
  { href: "/passes", label: "Tickets" },
  { href: "/contact", label: "Contact" },
];

function heroVideo() {
  return document.getElementById("hero-video") as HTMLVideoElement | null;
}

export default function DwHero() {
  const [muted, setMuted] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const v = heroVideo();
    if (!v) return;
    setMuted(v.muted);
    const onVol = () => setMuted(v.muted);
    v.addEventListener("volumechange", onVol);
    return () => v.removeEventListener("volumechange", onVol);
  }, []);

  // Fades the video's volume out smoothly as the hero scrolls out of view
  // (100 -> 90 -> 80 ...) instead of it staying at full volume until it's
  // suddenly out of frame. Never fades past 50% — it should stay audible,
  // just quieter, not disappear.
  const MIN_VOLUME = 0.5;

  useEffect(() => {
    let raf = 0;

    const update = () => {
      raf = 0;
      const section = sectionRef.current;
      const v = heroVideo();
      if (!section || !v) return;

      const rect = section.getBoundingClientRect();
      const scrolledPast = rect.height > 0 ? Math.min(1, Math.max(0, -rect.top / rect.height)) : 0;
      v.volume = 1 - scrolledPast * (1 - MIN_VOLUME);
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const toggleMute = () => {
    const v = heroVideo();
    const section = sectionRef.current;
    if (!v) return;
    v.muted = !v.muted;
    if (!v.muted) {
      if (section) {
        const rect = section.getBoundingClientRect();
        const scrolledPast = rect.height > 0 ? Math.min(1, Math.max(0, -rect.top / rect.height)) : 0;
        v.volume = 1 - scrolledPast * (1 - MIN_VOLUME);
      }
      v.play().catch(() => {});
    }
  };

  // A persistent frosted-glass backing keeps these legible over any frame of
  // the hero video, bright or dark — not just on hover.
  const pill =
    "touch-manipulation rounded-full border-2 border-dotted border-cream/70 bg-ink/35 px-4 py-1.5 font-italic italic text-sm text-cream shadow-[0_2px_16px_rgba(0,0,0,0.25)] backdrop-blur-md transition-colors hover:border-transparent hover:bg-cream hover:text-ink active:bg-cream active:text-ink";

  return (
    <section ref={sectionRef} className="h-[100svh] w-full">
      <div className="relative m-1.5 h-[calc(100svh-12px)] overflow-hidden rounded-[30px] bg-ink">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          id="hero-video"
          src="/hero.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: "contrast(1.02) saturate(0.95) sepia(0.04)" }}
        />
        <div className="pointer-events-none absolute inset-0 bg-ink/15" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 120% at 50% 45%, transparent 60%, rgba(9,12,19,0.38) 100%)",
          }}
        />

        {/* Top bar */}
        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-5 sm:px-9">
          <Link href="/" className="flex items-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dotted border-cream/70 bg-ink/35 shadow-[0_2px_16px_rgba(0,0,0,0.25)] backdrop-blur-md sm:h-16 sm:w-16">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="NUST Orientation" className="h-8 w-auto sm:h-10" />
            </span>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} className={pill}>
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"} className={pill}>
              {muted ? "Sound ✕" : "Sound ♪"}
            </button>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Menu"
              className={`${pill} md:hidden`}
            >
              {menuOpen ? "Close" : "Menu"}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="absolute inset-x-4 top-20 z-20 flex flex-col gap-2 rounded-[24px] border-2 border-dotted border-cream/40 bg-ink/85 p-4 backdrop-blur md:hidden">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-full px-4 py-3 text-center font-italic italic text-lg text-cream transition-colors hover:bg-cream/10 active:bg-cream/20"
              >
                {l.label}
              </a>
            ))}
          </div>
        )}

        {/* Bottom row */}
        <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-center px-6 py-6 sm:justify-between sm:px-9">
          <span className="hidden font-italic italic text-sm text-cream/80 sm:block">
            01–03 · 09 · 2026
          </span>
          <a href="/schedule" className={`${pill} px-6 py-3`}>
            View Schedule
          </a>
          <span dir="rtl" lang="ur" className="hidden font-urdu text-xl text-cream/80 sm:block">
            ON&apos;26
          </span>
        </div>
      </div>
    </section>
  );
}
