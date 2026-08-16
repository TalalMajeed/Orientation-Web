"use client";

import ThemeToggle from "@/components/website/site/ThemeToggle";
import CookieConsent from "@/components/website/site/CookieConsent";

// Website-only chrome (theme toggle, film grain, cookie consent).
// Kept out of the root layout so the admin pages are untouched.
export default function WebsiteChrome() {
  return (
    <>
      <ThemeToggle />
      <div className="grain-overlay" aria-hidden />
      <CookieConsent />
    </>
  );
}
