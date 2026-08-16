"use client";

import CookieConsent from "@/components/site/consent";
import ThemeToggle from "@/components/site/theme";

export default function SiteChrome() {
  return (
    <>
      <ThemeToggle />
      <div className="grain-overlay" aria-hidden />
      <CookieConsent />
    </>
  );
}
