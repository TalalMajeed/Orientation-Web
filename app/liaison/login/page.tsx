"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, DEMO_USER, DEMO_PASS } from "@/components/liaison/auth";

export default function LiaisonLogin() {
  const router = useRouter();
  const [user, setUser] = useState(DEMO_USER);
  const [pass, setPass] = useState(DEMO_PASS);
  const [err, setErr] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(user, pass)) router.push("/liaison");
    else setErr("Invalid credentials — use the demo login shown below.");
  };

  const field =
    "w-full rounded-full border-2 border-dotted border-fg/25 bg-transparent px-5 py-3 font-mono text-[13px] text-fg placeholder:text-fg/30 focus:border-fg focus:outline-none";

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-6 text-fg">
      <div className="w-full max-w-sm">
        <p className="font-italic text-sm italic text-fg/50">— NUST Orientation &apos;26</p>
        <h1 className="mt-2 font-serif text-7xl font-bold leading-none text-fg">Liaison</h1>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.2em] text-fg/50">
          OG team portal
        </p>

        <form onSubmit={submit} className="mt-10 space-y-3">
          <input className={field} placeholder="Username" value={user} onChange={(e) => setUser(e.target.value)} autoComplete="username" />
          <input className={field} type="password" placeholder="Password" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="current-password" />
          {err && <p className="font-mono text-[11px] text-ember">{err}</p>}
          <button
            type="submit"
            className="w-full rounded-full bg-ember px-6 py-3 font-mono text-[12px] uppercase tracking-[0.16em] text-cream transition hover:brightness-110"
          >
            Sign in
          </button>
        </form>

        <div className="mt-8 rounded-2xl border border-dashed border-fg/20 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg/40">Demo login</p>
          <p className="mt-2 font-mono text-[12px] text-fg/70">
            user: <span className="text-fg">{DEMO_USER}</span> &nbsp;·&nbsp; pass:{" "}
            <span className="text-fg">{DEMO_PASS}</span>
          </p>
        </div>
      </div>
    </main>
  );
}
