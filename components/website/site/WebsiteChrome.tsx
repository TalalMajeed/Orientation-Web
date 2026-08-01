"use client";

import ThemeToggle from "@/components/website/site/ThemeToggle";

// Website-only chrome (theme toggle, film grain).
// Kept out of the root layout so the ticketing/admin pages are untouched.
export default function WebsiteChrome() {
  return (
    <>
      <ThemeToggle />
      <div className="grain-overlay" aria-hidden />
    </>
  );
}
