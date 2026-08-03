"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SocialsLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(typeof data.error === "string" ? data.error : "Failed to sign in");
        return;
      }

      // The server component re-reads the session cookie and swaps the login
      // for the scanner once we refresh.
      router.replace("/socials");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  const field =
    "w-full rounded-full border-2 border-dotted border-fg/25 bg-transparent px-5 py-3 font-mono text-[13px] text-fg placeholder:text-fg/30 focus:border-fg focus:outline-none";

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-surface px-6 py-16 text-fg">
      <div className="w-full max-w-sm">
        <p className="font-italic text-sm italic text-fg/50">— NUST Orientation &apos;26</p>
        <h1 className="mt-2 font-serif text-5xl font-bold leading-none text-fg sm:text-6xl">
          Socials
        </h1>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-fg/50">
          Gate check-in — team sign in
        </p>

        <form className="mt-8 space-y-3" onSubmit={handleSubmit}>
          <label className="block font-mono text-[11px] uppercase tracking-[0.14em] text-fg/60">
            Username
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
              className={`mt-2 normal-case tracking-normal ${field}`}
            />
          </label>
          <label className="block font-mono text-[11px] uppercase tracking-[0.14em] text-fg/60">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              className={`mt-2 normal-case tracking-normal ${field}`}
            />
          </label>

          {error && (
            <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-ember">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-ember px-6 py-3 font-mono text-[12px] uppercase tracking-[0.16em] text-cream transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <a
          href="/admin"
          className="mt-8 block text-center font-mono text-[11px] uppercase tracking-[0.12em] text-fg/50 transition-opacity hover:opacity-60"
        >
          ← All portals
        </a>
      </div>
    </main>
  );
}
