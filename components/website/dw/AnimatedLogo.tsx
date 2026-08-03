"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

// A small continuous "idle" animation — gentle float + sway, looping forever.
// The glass circle mirrors the hero section's translucent pill buttons; the
// whole thing is decorative (aria-hidden), so it never competes with content.
export default function AnimatedLogo({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap
        .timeline({ repeat: -1, yoyo: true, defaults: { ease: "sine.inOut" } })
        .to(el, { y: -16, rotation: 5, duration: 3.4 })
        .to(el, { y: 4, rotation: -4, duration: 3.4 }, ">-0.2");
    });

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className={`flex items-center justify-center rounded-full border-2 border-dotted border-fg/25 bg-fg/[0.04] backdrop-blur-md shadow-[0_2px_16px_rgba(0,0,0,0.08)] ${className ?? ""}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="" className="h-[58%] w-[58%] object-contain" />
    </div>
  );
}
