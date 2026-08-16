"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const DEFAULT_LANDING: Record<string, string> = {
  admin: "/hr",
  liaison: "/liaison",
};

const BLOCKED: Record<string, string[]> = {
  admin: [],
  liaison: ["/hr"],
};

function safeNext(candidate: string | null): string | null {
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return null;
  }

  return candidate;
}

function canOpen(role: string, path: string): boolean {
  return !(BLOCKED[role] ?? []).some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

      const role = typeof data.role === "string" ? data.role : "admin";
      const next = safeNext(searchParams.get("next"));
      const landing = DEFAULT_LANDING[role] ?? DEFAULT_LANDING.admin;
      let destination: string;

      if (next && canOpen(role, next)) {
        destination = next;
      } else if (next) {
        destination = `${landing}?denied=${encodeURIComponent(next)}`;
      } else {
        destination = landing;
      }

      router.push(destination);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-surface px-6 py-16 text-fg">
      <div className="w-full max-w-sm">
        <p className="font-italic text-sm italic text-fg/50">— NUST Orientation &apos;26</p>
        <h1 className="mt-2 font-serif text-5xl font-bold leading-none text-fg sm:text-6xl">
          Staff
        </h1>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-fg/50">
          Sign in to the staff panels
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
              className="mt-2 w-full rounded-full border-2 border-dotted border-fg/25 bg-transparent px-5 py-3 font-mono text-[13px] normal-case tracking-normal text-fg placeholder:text-fg/30 focus:border-fg focus:outline-none"
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
              className="mt-2 w-full rounded-full border-2 border-dotted border-fg/25 bg-transparent px-5 py-3 font-mono text-[13px] normal-case tracking-normal text-fg placeholder:text-fg/30 focus:border-fg focus:outline-none"
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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
