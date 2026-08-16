"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { href: "/schedule", label: "Schedule" },
  { href: "/map", label: "Map" },
  { href: "/contact", label: "Contact" },
];

const MIN_VOLUME = 0.5;

const PILL =
  "touch-manipulation cursor-pointer rounded-full border-2 border-dotted border-cream/70 bg-ink/35 px-5 py-2.5 font-italic italic text-base font-bold text-cream shadow-[0_2px_16px_rgba(0,0,0,0.25)] backdrop-blur-md transition-colors hover:border-transparent hover:bg-cream hover:text-ink active:bg-cream active:text-ink";

function heroVideo() {
  return document.getElementById("hero-video") as HTMLVideoElement | null;
}

function scrolledPastRatio(section: HTMLElement) {
  const rect = section.getBoundingClientRect();

  return rect.height > 0 ? Math.min(1, Math.max(0, -rect.top / rect.height)) : 0;
}

export default function HeroSection() {
  const [muted, setMuted] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const video = heroVideo();
    if (!video) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMuted(video.muted);

    const onVolumeChange = () => setMuted(video.muted);
    video.addEventListener("volumechange", onVolumeChange);
    return () => video.removeEventListener("volumechange", onVolumeChange);
  }, []);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;

      const section = sectionRef.current;
      const video = heroVideo();
      if (!section || !video) return;

      video.volume = 1 - scrolledPastRatio(section) * (1 - MIN_VOLUME);
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const toggleMute = () => {
    const video = heroVideo();
    const section = sectionRef.current;
    if (!video) return;

    video.muted = !video.muted;
    if (video.muted) return;

    if (section) {
      video.volume = 1 - scrolledPastRatio(section) * (1 - MIN_VOLUME);
    }

    video.play().catch(() => {});
  };

  return (
    <section ref={sectionRef} className="h-[100svh] w-full">
      <div className="relative h-[100svh] w-full overflow-hidden bg-ink">
        <video
          id="hero-video"
          src="/hero.mp4"
          muted
          loop
          playsInline
          preload="auto"
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

        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-5 sm:px-9">
          <Link href="/" className="flex items-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dotted border-cream/70 bg-ink/35 shadow-[0_2px_16px_rgba(0,0,0,0.25)] backdrop-blur-md sm:h-16 sm:w-16">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="NUST Orientation" className="h-8 w-auto sm:h-10" />
            </span>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className={PILL}>
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"} className={PILL}>
              {muted ? "Sound ✕" : "Sound ♪"}
            </button>
            <button
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Menu"
              className={`${PILL} md:hidden`}
            >
              {menuOpen ? "Close" : "Menu"}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="absolute inset-x-4 top-20 z-20 flex flex-col gap-2 rounded-[24px] border-2 border-dotted border-cream/40 bg-ink/85 p-4 backdrop-blur md:hidden">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-full px-4 py-3 text-center font-italic text-lg italic text-cream transition-colors hover:bg-cream/10 active:bg-cream/20"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-center px-6 py-6 sm:justify-between sm:px-9">
          <span className="hidden font-italic text-sm italic text-cream/80 sm:block">
            01–03 · 09 · 2026
          </span>
          <a href="/schedule" className={`${PILL} px-6 py-3`}>
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
