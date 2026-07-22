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
      <p className="text-sm text-neutral-500">
        No events yet — create one before issuing tickets.
      </p>
    );
  }

  return (
    <select
      value={eventId ?? ""}
      onChange={(event) => onSelect(event.target.value)}
      className={`rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 ${className}`}
    >
      {events.map((event) => (
        <option key={event.id} value={event.id}>
          {event.name}
        </option>
      ))}
    </select>
  );
}
