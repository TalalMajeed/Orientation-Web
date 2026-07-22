"use client";

import { useCallback, useEffect, useState } from "react";

import type { EventDto } from "@/services/tickets/types";

const STORAGE_KEY = "orientation.eventId";

/**
 * Shared event selection. Remembered in localStorage so a scanner phone picks
 * its event once at the start of the night rather than on every reload.
 */
export function useEvents() {
  const [events, setEvents] = useState<EventDto[]>([]);
  const [eventId, setEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/events");

      if (!response.ok) {
        setError("Could not load events");
        return;
      }

      const data = await response.json();
      const loaded: EventDto[] = data.events ?? [];

      setEvents(loaded);

      const remembered = window.localStorage.getItem(STORAGE_KEY);
      const stillExists = loaded.some((event) => event.id === remembered);

      setEventId(stillExists ? remembered : (loaded[0]?.id ?? null));
    } catch {
      setError("Could not load events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, [load]);

  const selectEvent = useCallback((id: string) => {
    window.localStorage.setItem(STORAGE_KEY, id);
    setEventId(id);
  }, []);

  const selectedEvent = events.find((event) => event.id === eventId) ?? null;

  return { events, eventId, selectedEvent, selectEvent, loading, error, reload: load };
}
