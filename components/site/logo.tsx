"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function FloatingLogo({ className }: { className?: string }) {
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const context = gsap.context(() => {
      gsap
        .timeline({ repeat: -1, yoyo: true, defaults: { ease: "sine.inOut" } })
        .to(element, { y: -16, rotation: 5, duration: 3.4 })
        .to(element, { y: 4, rotation: -4, duration: 3.4 }, ">-0.2");
    });

    return () => context.revert();
  }, []);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img ref={ref} src="/logo.png" alt="" aria-hidden className={className} />
  );
}
