"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const NightSky = dynamic(() => import("@/components/site/sky"), { ssr: false });

function heroVideo() {
  return document.getElementById("hero-video") as HTMLVideoElement | null;
}

export default function EntryGate() {
  const [entered, setEntered] = useState(false);
  const [gone, setGone] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    document.body.style.overflow = entered ? "" : "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [entered]);

  const enter = () => {
    const video = heroVideo();

    if (video) {
      video.currentTime = 0;
      video.muted = false;
      video.play().catch(() => {});
    }

    setEntered(true);
    window.scrollTo(0, 0);
    window.dispatchEvent(new Event("site:entered"));
    window.setTimeout(() => setGone(true), 800);
  };

  if (gone) return null;

  return (
    <div
      data-entry-gate
      className={`fixed inset-0 z-[10000] flex flex-col items-center justify-center overflow-hidden px-6 text-center transition-opacity duration-700 ${
        entered ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      style={{
        background:
          "linear-gradient(to bottom, #0A1220 0%, #0E1B30 40%, #142744 75%, #1B3155 100%)",
      }}
    >
      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-[1400ms] ease-out ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <NightSky onReady={() => setVisible(true)} />
      </div>

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: 0.02,
          backgroundImage: "url('/noise.gif')",
          backgroundRepeat: "repeat",
        }}
      />

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(46% 40% at 50% 48%, rgba(9,12,19,0.45), transparent 75%)",
        }}
      />

      <div
        className={`relative z-10 flex flex-col items-center transition-opacity duration-[1400ms] ease-out ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <p dir="rtl" lang="ur" className="font-urdu text-6xl text-cream sm:text-8xl md:text-9xl">
          اب کہانی تمہاری ہے
        </p>
        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.35em] text-cream/70">
          Ab Kahani Tumhari Hai
        </p>

        <button
          type="button"
          onClick={enter}
          dir="rtl"
          lang="ur"
          className="mt-10 touch-manipulation cursor-pointer rounded-full border border-cream/50 px-10 py-3 font-urdu text-2xl leading-tight text-cream transition-colors hover:border-cream hover:bg-cream/10 active:bg-cream/20 sm:text-3xl"
        >
          چلو شروع کریں
        </button>
      </div>
    </div>
  );
}
