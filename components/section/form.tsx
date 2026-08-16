"use client";

import { useState } from "react";

const SUPPORT_EMAIL = "support@orientation.nust.edu.pk";

const FIELD =
  "w-full rounded-2xl border-2 border-dotted border-fg/25 bg-transparent px-5 py-3 font-mono text-[13px] normal-case tracking-normal text-fg placeholder:text-fg/30 focus:border-fg focus:outline-none";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const subject = `Message from ${name.trim() || "website visitor"}`;
    const body = email.trim()
      ? `${message.trim()}\n\n— ${name.trim() || "Anonymous"} (${email.trim()})`
      : message.trim();

    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 max-w-xl space-y-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg/45">
        Or send a quick message
      </p>
      <input
        required
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Your name"
        className={FIELD}
      />
      <input
        required
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@student.nust.edu.pk"
        className={FIELD}
      />
      <textarea
        required
        rows={2}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="What's up?"
        className={`${FIELD} resize-none`}
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
