"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

// A small continuous "idle" animation — gentle float + sway, looping forever.
// Purely decorative (aria-hidden), so it never competes with real content.
export default function AnimatedLogo({ className }: { className?: string }) {
  const ref = useRef<HTMLImageElement>(null);

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
    // eslint-disable-next-line @next/next/no-img-element
    <img ref={ref} src="/logo.png" alt="" aria-hidden className={className} />
  );
}
