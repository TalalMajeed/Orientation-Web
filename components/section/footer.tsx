"use client";

import { useState } from "react";
import Link from "next/link";

const columns: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Experience",
    links: [
      { label: "Schedule", href: "/schedule" },
      { label: "Map", href: "/map" },
    ],
  },
  {
    title: "Program",
    links: [
      { label: "Contact", href: "/contact" },
      { label: "Societies", href: "/societies" },
    ],
  },
];

const socials: { label: string; href: string; icon: React.ReactNode }[] = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/nustgram/",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
        <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="17.2" cy="6.8" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/nustofficial/",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
        <path
          d="M14 9h2.5V6H14c-1.93 0-3.5 1.57-3.5 3.5V11H8v3h2.5v6h3v-6h2.3l.5-3h-2.8V9.7c0-.5.2-.7.6-.7Z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/channel/UC7LwGPPk9zPYwUbtGKBJy5g",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
        <rect x="3" y="6" width="18" height="12" rx="3" stroke="currentColor" strokeWidth="1.6" />
        <path d="M10.5 9.5v5l4.5-2.5-4.5-2.5Z" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://pk.linkedin.com/school/nustofficial",
    icon: (
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
  },
];

type Status = "idle" | "loading" | "ok" | "error";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const subscribe = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/v1/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setStatus("error");
        setMessage(data.error || "Couldn't subscribe. Please try again.");
        return;
      }

      setStatus("ok");
      setMessage(data.message || "You're on the list — see you at Orientation.");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  return (
    <section id="contact" className="bg-surface">
      <div className="overflow-hidden bg-inverse-surface px-6 py-24 text-inverse-fg sm:px-12">
        <div className="mx-auto max-w-[1600px]">
          <p className="font-italic text-sm italic text-inverse-fg/50">— Stay in the loop</p>
          <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
            <h2 className="font-serif text-[8vw] font-bold leading-[0.85] text-inverse-fg lg:text-[4.5vw]">
              Don&apos;t miss a moment
            </h2>
            <form onSubmit={subscribe} className="w-full">
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="your.name@student.nust.edu.pk"
                  disabled={status === "loading"}
                  className="flex-1 rounded-full border-2 border-dotted border-inverse-fg/30 bg-transparent px-6 py-4 font-italic text-sm italic text-inverse-fg placeholder:text-inverse-fg/30 focus:border-inverse-fg focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="cursor-pointer rounded-full border-2 border-dotted border-transparent bg-ember px-8 py-4 font-italic text-sm italic text-cream transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {status === "loading" ? "…" : "Subscribe"}
                </button>
              </div>
              {message && (
                <p
                  role={status === "ok" ? undefined : "alert"}
                  className={`mt-3 font-italic text-sm italic ${
                    status === "ok" ? "text-sky" : "text-danger-inverse"
                  }`}
                >
                  {message}
                </p>
              )}
            </form>
          </div>

          <div className="mt-24 grid gap-10 border-t border-dashed border-inverse-fg/20 pt-12 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="NUST Orientation" className="h-12 w-auto" />
              <p className="mt-4 font-italic text-sm italic text-inverse-fg/50">
                NUST Islamabad © 2026
              </p>
              <div className="mt-5 flex gap-2">
                {socials.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-dotted border-inverse-fg/30 text-inverse-fg/80 transition-colors hover:border-inverse-fg hover:text-inverse-fg"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
            {columns.map((column) => (
              <div key={column.title}>
                <h3 className="font-italic text-sm italic text-inverse-fg/40">{column.title}</h3>
                <ul className="mt-4 space-y-2">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="font-italic text-sm italic text-inverse-fg/80 transition-opacity hover:opacity-50"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-dashed border-inverse-fg/20 pt-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <Link
                href="/privacy"
                className="link-sweep font-italic text-sm italic text-inverse-fg/60"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="link-sweep font-italic text-sm italic text-inverse-fg/60"
              >
                Terms of Service
              </Link>
            </div>
            <span dir="rtl" lang="ur" className="font-urdu text-lg text-inverse-fg/50">
              اب کہانی تمہاری ہے
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
