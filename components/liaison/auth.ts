"use client";

// Demo-only auth. Placeholder credentials, client-side flag in localStorage.
// TODO: replace with real auth (server session) later.
export const DEMO_USER = "liaison";
export const DEMO_PASS = "orientation26";

const KEY = "liaison-auth";

export function isAuthed(): boolean {
  try {
    return localStorage.getItem(KEY) === "yes";
  } catch {
    return false;
  }
}

export function login(user: string, pass: string): boolean {
  const ok = user.trim() === DEMO_USER && pass === DEMO_PASS;
  if (ok) {
    try {
      localStorage.setItem(KEY, "yes");
    } catch {}
  }
  return ok;
}

export function logout() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
