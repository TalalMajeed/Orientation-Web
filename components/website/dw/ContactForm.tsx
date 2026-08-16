"use client";

import { useState } from "react";

const SUPPORT_EMAIL = "support@orientation.nust.edu.pk";

// There is no backend for contact messages — this opens the visitor's own mail
// client with the message prefilled rather than pretending to save it
// somewhere.
export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const subject = `Message from ${name.trim() || "website visitor"}`;
    const body = email.trim() ? `${message.trim()}\n\n— ${name.trim() || "Anonymous"} (${email.trim()})` : message.trim();

    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  }

  const field =
    "w-full rounded-2xl border-2 border-dotted border-fg/25 bg-transparent px-5 py-3 font-mono text-[13px] normal-case tracking-normal text-fg placeholder:text-fg/30 focus:border-fg focus:outline-none";

  return (
    <form onSubmit={handleSubmit} className="mt-10 max-w-xl space-y-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg/45">
        Or send a quick message
      </p>
      <input
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        className={field}
      />
      <input
        required
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@student.nust.edu.pk"
        className={field}
      />
      <textarea
        required
        rows={2}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="What's up?"
        className="w-full resize-none rounded-2xl border-2 border-dotted border-fg/25 bg-transparent px-5 py-3 font-mono text-[13px] normal-case tracking-normal text-fg placeholder:text-fg/30 focus:border-fg focus:outline-none"
      />
      <button
        type="submit"
        className="cursor-pointer rounded-full border-2 border-transparent bg-fg px-6 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-surface transition-colors hover:bg-ember hover:text-cream"
      >
        Send message
      </button>
    </form>
  );
}
