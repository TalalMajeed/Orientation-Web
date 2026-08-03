"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import EventPicker from "./EventPicker";
import { useEvents } from "./useEvents";
import { formatPakistanDateTime } from "@/services/tickets/time";

interface Stats {
  total: number;
  issued: number;
  used: number;
  revoked: number;
}

export default function Overview() {
  const { events, eventId, selectedEvent, selectEvent, loading, reload } =
    useEvents();
  const [stats, setStats] = useState<Stats | null>(null);
  const [unsent, setUnsent] = useState<number>(0);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [venue, setVenue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!eventId) {
      setStats(null);
      return;
    }

    const [ticketsResponse, drainResponse] = await Promise.all([
      fetch(`/api/v1/event-tickets?eventId=${eventId}&pageSize=1`),
      fetch(`/api/v1/event-tickets/drain?eventId=${eventId}`),
    ]);

    if (ticketsResponse.ok) {
      const data = await ticketsResponse.json();
      setStats(data.stats);
    }

    if (drainResponse.ok) {
      const data = await drainResponse.json();
      setUnsent(data.remaining ?? 0);
    }
  }, [eventId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- stats follow the selected event
    loadStats();
  }, [loadStats]);

  async function handleCreate(submitEvent: React.FormEvent) {
    submitEvent.preventDefault();
    setCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          startsAt: startsAt ? new Date(startsAt).toISOString() : undefined,
          venue: venue || undefined,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not create");
        return;
      }

      setName("");
      setStartsAt("");
      setVenue("");
      await reload();
    } finally {
      setCreating(false);
    }
  }

  const notArrived = stats ? stats.issued : 0;

  const field =
    "w-full rounded-full border-2 border-dotted border-fg/25 bg-transparent px-5 py-3 font-mono text-[13px] text-fg placeholder:text-fg/30 focus:border-fg focus:outline-none";

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-5xl font-bold text-fg">Overview</h1>
          <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.08em] text-fg/50">
            {selectedEvent?.startsAt
              ? `${formatPakistanDateTime(selectedEvent.startsAt)} PKT`
              : "Pick an event to see its numbers."}
            {selectedEvent?.venue ? ` · ${selectedEvent.venue}` : ""}
          </p>
        </div>
        <EventPicker events={events} eventId={eventId} onSelect={selectEvent} />
      </div>

      {loading && (
        <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.1em] text-fg/50">
          Loading…
        </p>
      )}

      {!loading && stats && (
        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          {[
            { label: "Issued", value: stats.total - stats.revoked, dot: "var(--color-fg)" },
            { label: "Checked in", value: stats.used, dot: "var(--color-sky)" },
            { label: "Not arrived", value: notArrived, dot: "var(--color-navy)" },
            { label: "Revoked", value: stats.revoked, dot: "var(--color-ember)" },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-fg/12 bg-fg/[0.02] p-5"
            >
              <div className="text-4xl font-bold tabular-nums text-fg">
                {card.value}
              </div>
              <div className="mt-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-fg/50">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: card.dot }}
                />
                {card.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {unsent > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-ember/50 bg-ember/[0.06] p-4 font-mono text-[12px] text-fg">
          <span className="text-ember">
            {unsent} ticket{unsent === 1 ? "" : "s"} still waiting to be emailed.
          </span>
          <Link
            href="/event-tickets/issue"
            className="uppercase tracking-[0.1em] text-fg underline decoration-dotted underline-offset-4 hover:text-ember"
          >
            Send them
          </Link>
        </div>
      )}

      <section className="mt-14 max-w-xl">
        <h2 className="font-serif text-3xl font-bold text-fg">New event</h2>
        <p className="mt-2 font-mono text-[12px] leading-relaxed uppercase tracking-[0.06em] text-fg/50">
          A separate event per session keeps each gate&apos;s tickets apart.
        </p>

        <form onSubmit={handleCreate} className="mt-6 space-y-3">
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Orientation Day 1 — SEECS"
            className={field}
          />
          <div className="flex flex-wrap gap-3">
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
              className={`${field} flex-1`}
            />
            <input
              value={venue}
              onChange={(event) => setVenue(event.target.value)}
              placeholder="Jinnah Auditorium"
              className={`${field} flex-1`}
            />
          </div>

          {error && (
            <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-ember">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={creating}
            className="rounded-full border-2 border-transparent bg-fg px-6 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-surface transition-colors hover:bg-ember hover:text-cream disabled:cursor-not-allowed disabled:opacity-40"
          >
            {creating ? "Creating…" : "Create event"}
          </button>
        </form>
      </section>
    </div>
  );
}
