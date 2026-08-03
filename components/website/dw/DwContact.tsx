"use client";

import { useState } from "react";
import Link from "next/link";

const columns: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Experience",
    links: [
      { label: "Schedule", href: "/schedule" },
      { label: "Map", href: "/map" },
      { label: "Tickets", href: "/passes" },
      { label: "Scavenger Hunt", href: "/scavenger-hunt" },
      { label: "Gallery", href: "/gallery" },
    ],
  },
  {
    title: "Program",
    links: [
      { label: "About", href: "/about" },
      { label: "Plan", href: "/plan" },
      { label: "Contact", href: "/contact" },
      { label: "Team", href: "/about" },
    ],
  },
];

// Official NUST accounts — not orientation-specific pages, so these link out
// rather than to /contact.
const socials = [
  { label: "Instagram", href: "https://www.instagram.com/nustgram/" },
  { label: "Facebook", href: "https://www.facebook.com/nustofficial/" },
  { label: "YouTube", href: "https://www.youtube.com/channel/UC7LwGPPk9zPYwUbtGKBJy5g" },
  { label: "LinkedIn", href: "https://pk.linkedin.com/school/nustofficial" },
];

const socialIcons: Record<string, React.ReactNode> = {
  Instagram: (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" />
    </svg>
  ),
  Facebook: (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path
        d="M14 9h2.5V6H14c-1.93 0-3.5 1.57-3.5 3.5V11H8v3h2.5v6h3v-6h2.3l.5-3h-2.8V9.7c0-.5.2-.7.6-.7Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  ),
  YouTube: (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <rect x="3" y="6" width="18" height="12" rx="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10.5 9.5v5l4.5-2.5-4.5-2.5Z" fill="currentColor" />
    </svg>
  ),
  LinkedIn: (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="7.5" cy="7.7" r="1.1" fill="currentColor" />
      <path d="M7.5 10.8v6.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M11 17v-3.6c0-1.2.9-2.1 2-2.1s2 .9 2 2.1V17"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M11 10.8v6.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
};

export default function DwContact() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [message, setMessage] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/v1/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus("ok");
        setMessage(data.message || "You're on the list — see you at Orientation.");
        setEmail("");
      } else {
        setStatus("err");
        setMessage(data.error || "Couldn't subscribe. Please try again.");
      }
    } catch {
      setStatus("err");
      setMessage("Network error. Please try again.");
    }
  };

  return (
    <section id="contact" className="bg-surface px-1.5 pb-1.5">
      <div className="overflow-hidden rounded-[30px] bg-inverse-surface px-6 py-24 text-inverse-fg sm:px-12">
        <div className="mx-auto max-w-[1600px]">
          {/* Newsletter */}
          <p className="font-italic text-sm italic text-inverse-fg/50">— Stay in the loop</p>
          <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
            <h2 className="font-serif font-bold text-[13vw] leading-[0.85] text-inverse-fg lg:text-[8vw]">
              Don&apos;t miss a moment
            </h2>
            <form onSubmit={submit} className="w-full">
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.name@student.nust.edu.pk"
                  disabled={status === "loading"}
                  className="flex-1 rounded-full border-2 border-dotted border-inverse-fg/30 bg-transparent px-6 py-4 font-italic text-sm italic text-inverse-fg placeholder:text-inverse-fg/30 focus:border-inverse-fg focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="rounded-full border-2 border-dotted border-transparent bg-ember px-8 py-4 font-italic text-sm italic text-cream transition hover:brightness-110 disabled:opacity-50"
                >
                  {status === "loading" ? "…" : "Subscribe"}
                </button>
              </div>
              {message && (
                <p className={`mt-3 font-italic text-sm italic ${status === "ok" ? "text-sky" : "text-ember"}`}>
                  {message}
                </p>
              )}
            </form>
          </div>

          {/* Footer columns */}
          <div className="mt-24 grid gap-10 border-t border-dashed border-inverse-fg/20 pt-12 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="NUST Orientation" className="h-12 w-auto" />
              <p className="mt-4 font-italic text-sm italic text-inverse-fg/50">
                NUST Islamabad © 2026
              </p>
              <div className="mt-5 flex gap-2">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-dotted border-inverse-fg/30 text-inverse-fg/80 transition-colors hover:border-inverse-fg hover:text-inverse-fg"
                  >
                    {socialIcons[s.label]}
                  </a>
                ))}
              </div>
            </div>
            {columns.map((col) => (
              <div key={col.title}>
                <h3 className="font-italic text-sm italic text-inverse-fg/40">{col.title}</h3>
                <ul className="mt-4 space-y-2">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="font-italic text-sm italic text-inverse-fg/80 transition-opacity hover:opacity-50"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Get in touch */}
          <div className="mt-16">
            <p className="font-italic text-sm italic text-inverse-fg/50">
              Let&apos;s make your story unforgettable
            </p>
            <Link
              href="/contact"
              className="link-sweep mt-2 font-serif font-bold text-[20vw] leading-[0.8] text-inverse-fg lg:text-[15vw]"
            >
              Get in touch
            </Link>
          </div>

          {/* Credit */}
          <div className="mt-20 flex flex-col items-start justify-between gap-3 border-t border-dashed border-inverse-fg/20 pt-6 sm:flex-row sm:items-center">
            <a
              href="https://www.linkedin.com/in/faseeh06"
              target="_blank"
              rel="noopener noreferrer"
              className="link-sweep font-italic text-base italic text-inverse-fg/80"
            >
              UI designed by Faseeh
            </a>
            <span dir="rtl" lang="ur" className="font-urdu text-lg text-inverse-fg/50">
              اب کہانی تمہاری ہے
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
