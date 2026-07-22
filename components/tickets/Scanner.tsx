"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import EventPicker from "./EventPicker";
import { useEvents } from "./useEvents";
import { parseQrPayload } from "@/services/tickets/qr";
import { formatPakistanTime } from "@/services/tickets/time";
import type { CheckInResponse, CheckInResult } from "@/services/tickets/types";

const GATE_STORAGE_KEY = "orientation.gate";

/** The camera decodes the same code many times per second. */
const REPEAT_SUPPRESSION_MS = 3_000;
/** How long a ticket THIS device admitted still reads as amber, not red. */
const RECENT_ADMIT_MS = 60_000;
const PANEL_DISMISS_MS = 2_000;

type PanelKind = CheckInResult | "recent_local";

interface Panel {
  kind: PanelKind;
  holderName: string | null;
  email: string | null;
  detail: string | null;
}

const PANEL_STYLES: Record<PanelKind, string> = {
  valid: "bg-green-600 text-white",
  already_used: "bg-red-600 text-white",
  not_found: "bg-red-600 text-white",
  wrong_event: "bg-red-600 text-white",
  revoked: "bg-neutral-600 text-white",
  recent_local: "bg-amber-500 text-white",
};

const PANEL_TITLES: Record<PanelKind, string> = {
  valid: "LET THEM IN",
  already_used: "ALREADY USED",
  not_found: "NOT FOUND",
  wrong_event: "WRONG EVENT",
  revoked: "REVOKED",
  recent_local: "ALREADY ADMITTED",
};

interface RecentScan {
  at: number;
  kind: PanelKind;
  holderName: string | null;
}

interface SearchHit {
  id: string;
  holderName: string;
  email: string;
  status: string;
  usedAt: string | null;
  usedGate: string | null;
}

export default function Scanner() {
  const { events, eventId, selectedEvent, selectEvent } = useEvents();
  const [gate, setGate] = useState("");
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [recent, setRecent] = useState<RecentScan[]>([]);
  const [checkedIn, setCheckedIn] = useState<number | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualQuery, setManualQuery] = useState("");
  const [manualHits, setManualHits] = useState<SearchHit[]>([]);
  const [manualError, setManualError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<{ stop: () => void; destroy: () => void } | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const lastSeenRef = useRef(new Map<string, number>());
  const admittedRef = useRef(new Map<string, number>());
  const dismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const eventIdRef = useRef<string | null>(null);
  const gateRef = useRef("");

  // The decode callback is created once and captured by the scanner, so it
  // reads the current event and gate through refs rather than closing over
  // stale state.
  useEffect(() => {
    eventIdRef.current = eventId;
    gateRef.current = gate;
  }, [eventId, gate]);

  useEffect(() => {
    const remembered = window.localStorage.getItem(GATE_STORAGE_KEY);

    if (remembered) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring saved gate on mount
      setGate(remembered);
    }
  }, []);

  /**
   * iOS blocks audio until a user gesture, so the context is created by the
   * same tap that starts the camera. Vibration is a bonus: navigator.vibrate
   * does not exist on iOS at all, which is why the visual panel and the beep
   * carry the signal on their own.
   */
  const feedback = useCallback((kind: PanelKind) => {
    const good = kind === "valid";

    try {
      const context = audioRef.current;

      if (context) {
        const oscillator = context.createOscillator();
        const gain = context.createGain();

        oscillator.frequency.value = good ? 880 : 220;
        gain.gain.value = 0.15;
        oscillator.connect(gain).connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + (good ? 0.12 : 0.4));
      }
    } catch {
      // An unavailable audio context must never stop a check-in.
    }

    if (typeof navigator.vibrate === "function") {
      navigator.vibrate(good ? 80 : [120, 80, 120]);
    }
  }, []);

  const showPanel = useCallback(
    (next: Panel) => {
      feedback(next.kind);
      setPanel(next);
      setRecent((previous) =>
        [
          { at: Date.now(), kind: next.kind, holderName: next.holderName },
          ...previous,
        ].slice(0, 5)
      );

      if (dismissRef.current) {
        clearTimeout(dismissRef.current);
      }

      dismissRef.current = setTimeout(() => setPanel(null), PANEL_DISMISS_MS);
    },
    [feedback]
  );

  const applyResponse = useCallback(
    (data: CheckInResponse, token: string | null) => {
      if (data.result === "valid" && token) {
        admittedRef.current.set(token, Date.now());
      }

      setCheckedIn(data.checkedInCount);

      const detail =
        data.result === "already_used" && data.usedAt
          ? `First used ${formatPakistanTime(data.usedAt)}${data.usedGate ? ` at ${data.usedGate}` : ""}`
          : null;

      showPanel({
        kind: data.result,
        holderName: data.holderName,
        email: data.email,
        detail,
      });
    },
    [showPanel]
  );

  const handleDecode = useCallback(
    async (payload: string) => {
      const token = parseQrPayload(payload);

      // Not one of ours — a poster, a WiFi code, someone's payment app. Ignored
      // without a network call, so it never reaches scan_log either.
      if (!token) {
        return;
      }

      const now = Date.now();
      const lastSeen = lastSeenRef.current.get(token);

      if (lastSeen && now - lastSeen < REPEAT_SUPPRESSION_MS) {
        return;
      }

      lastSeenRef.current.set(token, now);

      const admittedAt = admittedRef.current.get(token);

      // Staff routinely rescan someone they just waved through. A hard red here
      // teaches them to distrust red, so this case is amber and stays local.
      if (admittedAt && now - admittedAt < RECENT_ADMIT_MS) {
        showPanel({
          kind: "recent_local",
          holderName: null,
          email: null,
          detail: `You admitted this ${Math.round((now - admittedAt) / 1000)}s ago`,
        });
        return;
      }

      const currentEventId = eventIdRef.current;

      if (!currentEventId) {
        return;
      }

      try {
        const response = await fetch("/api/v1/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            eventId: currentEventId,
            gate: gateRef.current || "unknown",
          }),
        });

        if (!response.ok) {
          throw new Error("Check-in failed");
        }

        applyResponse(await response.json(), token);
      } catch {
        // Never show green for something we could not confirm.
        showPanel({
          kind: "not_found",
          holderName: null,
          email: null,
          detail: "No network — could not verify. Try again.",
        });
        lastSeenRef.current.delete(token);
      }
    },
    [applyResponse, showPanel]
  );

  async function startScanning() {
    if (!eventId) {
      return;
    }

    window.localStorage.setItem(GATE_STORAGE_KEY, gate);
    setCameraError(null);

    try {
      audioRef.current = new AudioContext();
      await audioRef.current.resume();
    } catch {
      audioRef.current = null;
    }

    setScanning(true);
  }

  useEffect(() => {
    if (!scanning || !videoRef.current) {
      return;
    }

    let cancelled = false;
    const video = videoRef.current;

    async function begin() {
      const { default: QrScanner } = await import("qr-scanner");

      if (cancelled) {
        return;
      }

      const scanner = new QrScanner(video, (result) => handleDecode(result.data), {
        preferredCamera: "environment",
        highlightScanRegion: true,
        highlightCodeOutline: true,
        maxScansPerSecond: 5,
      });

      scannerRef.current = scanner;

      try {
        await scanner.start();
      } catch {
        setCameraError(
          "Could not open the camera. Check permissions, and note the page must be served over HTTPS."
        );
      }
    }

    begin();

    return () => {
      cancelled = true;
      scannerRef.current?.stop();
      scannerRef.current?.destroy();
      scannerRef.current = null;
    };
  }, [scanning, handleDecode]);

  useEffect(() => {
    return () => {
      if (dismissRef.current) {
        clearTimeout(dismissRef.current);
      }
    };
  }, []);

  async function runManualSearch(submitEvent: React.FormEvent) {
    submitEvent.preventDefault();
    setManualError(null);

    if (!eventId) {
      return;
    }

    const params = new URLSearchParams({ eventId, q: manualQuery.trim() });
    const response = await fetch(`/api/v1/event-tickets/search?${params}`);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setManualError(typeof data.error === "string" ? data.error : "Search failed");
      setManualHits([]);
      return;
    }

    setManualHits(data.tickets ?? []);
  }

  async function manualCheckIn(hit: SearchHit) {
    if (!eventId) {
      return;
    }

    const response = await fetch("/api/v1/checkin/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticketId: hit.id,
        eventId,
        gate: gateRef.current || "unknown",
      }),
    });

    if (!response.ok) {
      setManualError("Check-in failed");
      return;
    }

    applyResponse(await response.json(), null);
    setManualOpen(false);
    setManualQuery("");
    setManualHits([]);
  }

  if (!scanning) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6 py-12">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Gate scanner</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Pick the event and name this gate. Both are remembered on this phone.
          </p>
        </div>

        <label className="block text-sm font-medium">
          Event
          <EventPicker
            events={events}
            eventId={eventId}
            onSelect={selectEvent}
            className="mt-1 w-full"
          />
        </label>

        <label className="block text-sm font-medium">
          Gate
          <input
            value={gate}
            onChange={(event) => setGate(event.target.value)}
            placeholder="main-gate"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-neutral-400"
          />
        </label>

        <button
          type="button"
          onClick={startScanning}
          disabled={!eventId}
          className="rounded-lg bg-neutral-900 px-4 py-5 text-lg font-semibold text-white disabled:opacity-50"
        >
          Start scanning
        </button>
        <p className="text-xs text-neutral-500">
          This tap also unlocks the beep — iOS will not play sound without it.
        </p>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-black text-white">
      <video ref={videoRef} className="h-screen w-full object-cover" muted playsInline />

      <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-black/60 px-4 py-3 text-sm">
        <span>
          {selectedEvent?.name ?? "—"} · {gate || "unknown gate"}
        </span>
        <span className="font-semibold tabular-nums">
          {checkedIn === null ? "—" : checkedIn} in
        </span>
      </div>

      {cameraError && (
        <p className="absolute inset-x-0 top-14 bg-red-600 px-4 py-3 text-sm">
          {cameraError}
        </p>
      )}

      <div className="absolute inset-x-0 bottom-0 space-y-2 bg-black/60 px-4 py-3">
        <button
          type="button"
          onClick={() => setManualOpen((open) => !open)}
          className="w-full rounded-md border border-white/40 px-4 py-3 text-base font-medium"
        >
          {manualOpen ? "Close" : "Can't scan?"}
        </button>

        {manualOpen && (
          <div className="space-y-2">
            <form onSubmit={runManualSearch} className="flex gap-2">
              <input
                value={manualQuery}
                onChange={(event) => setManualQuery(event.target.value)}
                placeholder="Name or email"
                className="flex-1 rounded-md bg-white px-3 py-3 text-base text-neutral-900"
              />
              <button
                type="submit"
                className="rounded-md bg-white px-4 py-3 text-base font-medium text-neutral-900"
              >
                Find
              </button>
            </form>

            {manualError && <p className="text-sm text-red-300">{manualError}</p>}

            {manualHits.map((hit) => (
              <button
                key={hit.id}
                type="button"
                onClick={() => manualCheckIn(hit)}
                className="flex w-full items-center justify-between rounded-md bg-white/10 px-3 py-3 text-left"
              >
                <span>
                  <span className="block font-medium">{hit.holderName}</span>
                  <span className="block text-xs text-white/70">{hit.email}</span>
                </span>
                <span className="text-xs uppercase">{hit.status}</span>
              </button>
            ))}
          </div>
        )}

        {!manualOpen && recent.length > 0 && (
          <ul className="space-y-1 text-xs text-white/80">
            {recent.map((scan) => (
              <li key={scan.at} className="flex justify-between">
                <span>{scan.holderName ?? PANEL_TITLES[scan.kind]}</span>
                <span>{formatPakistanTime(new Date(scan.at))}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {panel && (
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center px-6 text-center ${PANEL_STYLES[panel.kind]}`}
        >
          <div className="text-8xl leading-none">
            {panel.kind === "valid" ? "✓" : panel.kind === "revoked" ? "•" : "✕"}
          </div>

          {/* The name is the check: staff compare it against the person. */}
          {panel.holderName && (
            <p className="mt-6 text-4xl font-bold break-words">{panel.holderName}</p>
          )}
          {panel.email && <p className="mt-2 text-base opacity-80">{panel.email}</p>}

          <p className="mt-6 text-2xl font-semibold tracking-wide">
            {PANEL_TITLES[panel.kind]}
          </p>
          {panel.detail && <p className="mt-2 text-lg opacity-90">{panel.detail}</p>}
        </div>
      )}
    </main>
  );
}
