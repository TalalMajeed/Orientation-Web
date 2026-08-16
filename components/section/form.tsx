"use client";

import { useState } from "react";

const FIELD =
  "w-full rounded-2xl border-2 border-dotted border-fg/25 bg-transparent px-5 py-3 font-mono text-[13px] normal-case tracking-normal text-fg placeholder:text-fg/30 focus:border-fg focus:outline-none disabled:opacity-50";

type Status = "idle" | "loading" | "ok" | "error";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [feedback, setFeedback] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setFeedback("");

    try {
      const response = await fetch("/api/v1/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setStatus("error");
        setFeedback(data.error || "Couldn't send your message. Please try again.");
        return;
      }

      setStatus("ok");
      setFeedback(data.message || "Message sent — we'll get back to you.");
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setStatus("error");
      setFeedback("Network error. Please try again.");
    }
  }

  const sending = status === "loading";

  return (
    <form onSubmit={handleSubmit} className="mt-10 max-w-xl space-y-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg/45">
        Or send a quick message
      </p>
      <input
        required
        maxLength={120}
        value={name}
        onChange={(event) => setName(event.target.value)}
        disabled={sending}
        placeholder="Your name"
        className={FIELD}
      />
      <input
        required
        type="email"
        maxLength={200}
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        disabled={sending}
        placeholder="you@email.com"
        className={FIELD}
      />
      <textarea
        required
        rows={2}
        minLength={10}
        maxLength={4000}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        disabled={sending}
        placeholder="What's up?"
        className={`${FIELD} resize-none`}
      />
      <button
        type="submit"
        disabled={sending}
        className="cursor-pointer rounded-full border-2 border-transparent bg-fg px-6 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-surface transition-colors hover:bg-ember hover:text-cream disabled:cursor-not-allowed disabled:opacity-50"
      >
        {sending ? "Sending…" : "Send message"}
      </button>
      {feedback && (
        <p
          aria-live="polite"
          className={`font-italic text-sm italic ${
            status === "ok" ? "text-fg/70" : "text-ember"
          }`}
        >
          {feedback}
        </p>
      )}
    </form>
  );
}
