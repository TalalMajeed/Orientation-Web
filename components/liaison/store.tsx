"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Config, House, LogEntry, Student } from "./types";
import { seedHouses } from "./seed";
import { allocate } from "./logic";

type State = {
  houses: House[];
  students: Student[];
  config: Config;
  log: LogEntry[];
  allocated: boolean;
};

type Ctx = State & {
  loaded: boolean;
  setUpload: (students: Student[], log: LogEntry[]) => void;
  runAllocation: () => void;
  loadDemoAndAllocate: (students: Student[]) => void;
  resetAllocation: () => void;
  setConfig: (c: Partial<Config>) => void;
  updateHouse: (id: string, patch: Partial<Pick<House, "ol">>) => void;
  updateOG: (houseId: string, ogId: string, name: string) => void;
  reseedHouses: () => void;
  clearAll: () => void;
};

const KEY = "liaison-state-v1";
const defaultState: State = {
  houses: seedHouses(),
  students: [],
  config: { houseCapacity: null },
  log: [],
  allocated: false,
};

const LiaisonCtx = createContext<Ctx | null>(null);

export function LiaisonProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(defaultState);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState({ ...defaultState, ...JSON.parse(raw) });
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {}
  }, [state, loaded]);

  const value: Ctx = {
    ...state,
    loaded,
    setUpload: (students, log) => setState((s) => ({ ...s, students, log, allocated: false })),
    runAllocation: () =>
      setState((s) => {
        const { students, log } = allocate(s.students, s.houses, s.config);
        return { ...s, students, log, allocated: true };
      }),
    // Seed a demo batch and divide it in one atomic step, so the allocation
    // view can be populated end-to-end from a single click.
    loadDemoAndAllocate: (demo) =>
      setState((s) => {
        const { students, log } = allocate(demo, s.houses, s.config);
        return { ...s, students, log, allocated: true };
      }),
    resetAllocation: () =>
      setState((s) => ({
        ...s,
        students: s.students.map((st) => ({ ...st, houseId: null, ogId: null })),
        allocated: false,
      })),
    setConfig: (c) => setState((s) => ({ ...s, config: { ...s.config, ...c } })),
    updateHouse: (id, patch) =>
      setState((s) => ({ ...s, houses: s.houses.map((h) => (h.id === id ? { ...h, ...patch } : h)) })),
    updateOG: (houseId, ogId, name) =>
      setState((s) => ({
        ...s,
        houses: s.houses.map((h) =>
          h.id === houseId ? { ...h, ogs: h.ogs.map((o) => (o.id === ogId ? { ...o, name } : o)) } : h
        ),
      })),
    reseedHouses: () => setState((s) => ({ ...s, houses: seedHouses() })),
    clearAll: () => setState(defaultState),
  };

  return <LiaisonCtx.Provider value={value}>{children}</LiaisonCtx.Provider>;
}

export function useLiaison() {
  const c = useContext(LiaisonCtx);
  if (!c) throw new Error("useLiaison must be used within LiaisonProvider");
  return c;
}
