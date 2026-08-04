"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "ow-cookie-consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;

    const show = () => setVisible(true);

    // Homepage has an entry gate ("چلو شروع کریں") — wait for it before
    // showing the banner so it doesn't sit behind/under the gate overlay.
    if (document.querySelector("[data-entry-gate]")) {
      window.addEventListener("site:entered", show);
      return () => window.removeEventListener("site:entered", show);
    }

    const t = window.setTimeout(show, 500);
    return () => window.clearTimeout(t);
  }, []);

  const respond = (value: "accepted" | "declined") => {
    localStorage.setItem(STORAGE_KEY, value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed inset-x-4 bottom-4 z-[9000] mx-auto max-w-md rounded-3xl border-2 border-dotted border-inverse-fg/20 bg-inverse-surface px-6 py-5 text-inverse-fg shadow-2xl transition-opacity duration-500 sm:left-4 sm:right-auto sm:mx-0"
    >
      <p className="font-italic text-sm italic text-inverse-fg/50">— A quick note</p>
      <p className="mt-2 font-serif text-xl font-bold leading-snug text-inverse-fg">
        We use cookies
      </p>
      <p className="mt-2 font-italic text-sm italic text-inverse-fg/70">
        We use cookies to keep you signed in and understand how Orientation is used.
        Read our{" "}
        <a href="/privacy" className="link-sweep">
          Privacy Policy
        </a>{" "}
        to learn more.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => respond("accepted")}
          className="cursor-pointer rounded-full border-2 border-dotted border-transparent bg-ember px-6 py-2.5 font-italic text-sm italic text-cream transition hover:brightness-110"
        >
          Accept
        </button>
        <button
          type="button"
          onClick={() => respond("declined")}
          className="cursor-pointer rounded-full border-2 border-dotted border-inverse-fg/30 px-6 py-2.5 font-italic text-sm italic text-inverse-fg transition hover:border-inverse-fg"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
