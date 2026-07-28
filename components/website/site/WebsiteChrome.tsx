"use client";

import SmoothScroll from "@/components/website/SmoothScroll";
import ThemeToggle from "@/components/website/site/ThemeToggle";

// Website-only chrome (smooth scroll, theme toggle, film grain).
// Kept out of the root layout so the ticketing/admin pages are untouched.
export default function WebsiteChrome() {
  return (
    <>
      <SmoothScroll />
      <ThemeToggle />
      <div className="grain-overlay" aria-hidden />
    </>
  );
}
