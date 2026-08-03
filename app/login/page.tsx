"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const DEFAULT_LANDING: Record<string, string> = {
  admin: "/event-tickets",
  ticketing: "/event-tickets",
  scanner: "/scan",
};

/**
 * Prefixes each role cannot open — the mirror of proxy.ts's GUARDED table.
 * Duplicated because this is a client component and the session module is
 * server-only; proxy.ts is still the one that enforces it.
 */
const BLOCKED: Record<string, string[]> = {
  admin: [],
  ticketing: ["/hr"],
  scanner: ["/event-tickets", "/hr"],
};

/** Only same-origin relative paths, so ?next= cannot bounce staff off-site. */
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
        setError(
          typeof data.error === "string" ? data.error : "Failed to sign in"
        );
        return;
      }

      const role = typeof data.role === "string" ? data.role : "admin";
      const next = safeNext(searchParams.get("next"));
      const landing = DEFAULT_LANDING[role] ?? DEFAULT_LANDING.admin;
      let destination: string;

      // Sending someone to a page their role cannot open would only bounce them
      // back here, so they land on their own page — but carry the reason, or the
      // page they asked for silently vanishes and the link looks broken.
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
    <main className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Staff Sign In</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Orientation staff access.
      </p>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-neutral-700">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            required
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Signing in…" : "Sign In"}
        </button>
      </form>
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
