"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Config, House, LiaisonState, LogEntry, Student } from "./types";

type Ctx = LiaisonState & {
  loaded: boolean;
  error: string | null;
  busy: boolean;
  setUpload: (students: Student[], log: LogEntry[]) => Promise<void>;
  runAllocation: () => Promise<void>;
  loadDemoAndAllocate: (students: Student[]) => Promise<void>;
  resetAllocation: () => Promise<void>;
  setConfig: (c: Partial<Config>) => Promise<void>;
  updateHouse: (id: string, patch: Partial<Pick<House, "ol">>) => Promise<void>;
  updateOG: (houseId: string, ogId: string, name: string) => Promise<void>;
  reseedHouses: () => Promise<void>;
  clearAll: () => Promise<void>;
};

const API = "/api/v1/liaison";

// Rendered before the first fetch lands. The server owns the real state, so
// this is only ever a placeholder — never something that gets saved.
const emptyState: LiaisonState = {
  houses: [],
  students: [],
  config: { houseCapacity: null },
  log: [],
  allocated: false,
};

const LiaisonCtx = createContext<Ctx | null>(null);

export function LiaisonProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LiaisonState>(emptyState);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Every endpoint answers with the whole workspace, so each call ends by
   * replacing state outright. Nothing is applied optimistically: a write that
   * the server rejected must not linger on screen as though it succeeded.
   */
  const send = useCallback(
    async (path: string, init?: RequestInit): Promise<void> => {
      setBusy(true);
      setError(null);

      try {
        const response = await fetch(`${API}${path}`, {
          ...init,
          headers: init?.body ? { "Content-Type": "application/json" } : undefined,
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          setError(typeof data.error === "string" ? data.error : "Request failed");
          return;
        }

        if (data.state) {
          setState(data.state as LiaisonState);
        }
      } catch {
        setError("Could not reach the server");
      } finally {
        setBusy(false);
      }
    },
    []
  );

  // Load the workspace once on mount. This is the "subscribe to an external
  // system" case the rule exists for — the state lives on the server, and the
  // only way to have it is to go and ask.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch of server-owned state
    void send("/state").finally(() => setLoaded(true));
  }, [send]);

  const value: Ctx = {
    ...state,
    loaded,
    busy,
    error,
    setUpload: (students, log) =>
      send("/students", { method: "PUT", body: JSON.stringify({ students, log }) }),
    runAllocation: () => send("/allocation", { method: "POST" }),
    // Seed a demo batch and divide it in one call, so the allocation view can
    // be populated end-to-end from a single click — and in one server write.
    loadDemoAndAllocate: (demo) =>
      send("/allocation", { method: "POST", body: JSON.stringify({ students: demo }) }),
    resetAllocation: () => send("/allocation", { method: "DELETE" }),
    setConfig: (c) => send("/config", { method: "PATCH", body: JSON.stringify(c) }),
    updateHouse: (id, patch) =>
      send(`/houses/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      }),
    updateOG: (houseId, ogId, name) =>
      send(`/houses/${encodeURIComponent(houseId)}`, {
        method: "PATCH",
        body: JSON.stringify({ ogId, name }),
      }),
    reseedHouses: () => send("/houses/reseed", { method: "POST" }),
    clearAll: () => send("/state", { method: "DELETE" }),
  };

  return <LiaisonCtx.Provider value={value}>{children}</LiaisonCtx.Provider>;
}

export function useLiaison() {
  const c = useContext(LiaisonCtx);
  if (!c) throw new Error("useLiaison must be used within LiaisonProvider");
  return c;
}
