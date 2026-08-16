"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Config, House, LiaisonState, LogEntry, Student } from "@/components/liaison/types";

type LiaisonStore = LiaisonState & {
  loaded: boolean;
  error: string | null;
  busy: boolean;
  setUpload: (students: Student[], log: LogEntry[]) => Promise<void>;
  runAllocation: () => Promise<void>;
  loadDemoAndAllocate: (students: Student[]) => Promise<void>;
  resetAllocation: () => Promise<void>;
  setConfig: (config: Partial<Config>) => Promise<void>;
  updateHouse: (id: string, patch: Partial<Pick<House, "ol">>) => Promise<void>;
  updateOg: (houseId: string, ogId: string, name: string) => Promise<void>;
  reseedHouses: () => Promise<void>;
  clearAll: () => Promise<void>;
};

const API = "/api/v1/liaison";

const EMPTY_STATE: LiaisonState = {
  houses: [],
  students: [],
  config: { houseCapacity: null },
  log: [],
  allocated: false,
};

const LiaisonContext = createContext<LiaisonStore | null>(null);

export function LiaisonProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LiaisonState>(EMPTY_STATE);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(async (path: string, init?: RequestInit): Promise<void> => {
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
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void send("/state").finally(() => setLoaded(true));
  }, [send]);

  const store: LiaisonStore = {
    ...state,
    loaded,
    busy,
    error,
    setUpload: (students, log) =>
      send("/students", { method: "PUT", body: JSON.stringify({ students, log }) }),
    runAllocation: () => send("/allocation", { method: "POST" }),
    loadDemoAndAllocate: (students) =>
      send("/allocation", { method: "POST", body: JSON.stringify({ students }) }),
    resetAllocation: () => send("/allocation", { method: "DELETE" }),
    setConfig: (config) => send("/config", { method: "PATCH", body: JSON.stringify(config) }),
    updateHouse: (id, patch) =>
      send(`/houses/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      }),
    updateOg: (houseId, ogId, name) =>
      send(`/houses/${encodeURIComponent(houseId)}`, {
        method: "PATCH",
        body: JSON.stringify({ ogId, name }),
      }),
    reseedHouses: () => send("/houses/reseed", { method: "POST" }),
    clearAll: () => send("/state", { method: "DELETE" }),
  };

  return <LiaisonContext.Provider value={store}>{children}</LiaisonContext.Provider>;
}

export function useLiaison() {
  const store = useContext(LiaisonContext);

  if (!store) {
    throw new Error("useLiaison must be used within LiaisonProvider");
  }

  return store;
}
