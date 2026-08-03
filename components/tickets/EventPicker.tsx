"use client";

import type { EventDto } from "@/services/tickets/types";

export default function EventPicker({
  events,
  eventId,
  onSelect,
  className = "",
}: {
  events: EventDto[];
  eventId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}) {
  if (events.length === 0) {
    return (
      <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-fg/50">
        No events yet — create one first.
      </p>
    );
  }

  return (
    <div className={`relative inline-block ${className}`}>
      <select
        value={eventId ?? ""}
        onChange={(event) => onSelect(event.target.value)}
        className="w-full cursor-pointer appearance-none rounded-full border-2 border-dotted border-fg/40 bg-surface py-2 pl-4 pr-10 font-mono text-[11px] uppercase tracking-[0.1em] text-fg transition-colors hover:border-fg focus:border-fg focus:outline-none"
      >
        {events.map((event) => (
          <option key={event.id} value={event.id}>
            {event.name}
          </option>
        ))}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 12 12"
        className="pointer-events-none absolute right-4 top-1/2 h-2.5 w-2.5 -translate-y-1/2 text-fg/50"
      >
        <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
