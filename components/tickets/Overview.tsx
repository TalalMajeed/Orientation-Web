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

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {selectedEvent?.startsAt
              ? `${formatPakistanDateTime(selectedEvent.startsAt)} PKT`
              : "Pick an event to see its numbers."}
            {selectedEvent?.venue ? ` · ${selectedEvent.venue}` : ""}
          </p>
        </div>
        <EventPicker events={events} eventId={eventId} onSelect={selectEvent} />
      </div>

      {loading && <p className="mt-8 text-sm text-neutral-500">Loading…</p>}

      {!loading && stats && (
        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          {[
            { label: "Issued", value: stats.total - stats.revoked },
            { label: "Checked in", value: stats.used },
            { label: "Not arrived", value: notArrived },
            { label: "Revoked", value: stats.revoked },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-lg border border-neutral-200 bg-white p-5"
            >
              <div className="text-3xl font-semibold tabular-nums">
                {card.value}
              </div>
              <div className="mt-1 text-sm text-neutral-500">{card.label}</div>
            </div>
          ))}
        </div>
      )}

      {unsent > 0 && (
        <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          {unsent} ticket{unsent === 1 ? "" : "s"} still waiting to be emailed.{" "}
          <Link href="/event-tickets/issue" className="font-medium underline">
            Send them
          </Link>
        </div>
      )}

      <section className="mt-12 max-w-xl">
        <h2 className="text-lg font-semibold tracking-tight">New event</h2>
        <p className="mt-1 text-sm text-neutral-500">
          A separate event per session keeps each gate&apos;s tickets apart.
        </p>

        <form onSubmit={handleCreate} className="mt-4 space-y-3">
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Orientation Day 1 — SEECS"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
          />
          <div className="flex flex-wrap gap-3">
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
              className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
            />
            <input
              value={venue}
              onChange={(event) => setVenue(event.target.value)}
              placeholder="Jinnah Auditorium"
              className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={creating}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? "Creating…" : "Create event"}
          </button>
        </form>
      </section>
    </div>
  );
}
