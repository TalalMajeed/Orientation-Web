"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const Scene = dynamic(() => import("@/components/website/hero/Scene"), { ssr: false });

function heroVideo() {
  return document.getElementById("hero-video") as HTMLVideoElement | null;
}

export default function EntryExperience() {
  const [entered, setEntered] = useState(false);
  const [gone, setGone] = useState(false);
  const [visible, setVisible] = useState(false);

  // Lock page scroll while the gate is up.
  useEffect(() => {
    document.body.style.overflow = entered ? "" : "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [entered]);

  // Fade the clouds and the text/button in together, once the WebGL scene
  // has actually loaded and created its context (not just mounted the
  // wrapper div) — otherwise the dynamic-imported clouds pop in after the
  // opacity transition has already finished.
  const onSceneReady = () => setVisible(true);

  const enter = () => {
    // The hero video has no autoplay — it starts here, from frame one, the
    // moment the gate is dismissed (this click is also the user gesture
    // that lets it start unmuted).
    const v = heroVideo();
    if (v) {
      v.currentTime = 0;
      v.muted = false;
      v.play().catch(() => {});
    }
    setEntered(true);
    window.scrollTo(0, 0);
    window.dispatchEvent(new Event("site:entered"));
    // Unmount the gate (and free its WebGL context) after the fade.
    window.setTimeout(() => setGone(true), 800);
  };

  return (
    <>
      {!gone && (
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
          {/* WebGL stars + clouds (original scene + AdaptiveDpr for mobile) */}
          <div
            className={`pointer-events-none absolute inset-0 transition-opacity duration-[1400ms] ease-out ${
              visible ? "opacity-100" : "opacity-0"
            }`}
          >
            <Scene onReady={onSceneReady} />
          </div>

          {/* Very light gate-only grain (the gate sits above the stronger site-wide grain) */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              opacity: 0.02,
              backgroundImage: "url('/noise.gif')",
              backgroundRepeat: "repeat",
            }}
          />

          {/* Legibility scrim */}
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
      )}
    </>
  );
}
