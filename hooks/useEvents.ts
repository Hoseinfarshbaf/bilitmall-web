"use client";

import { useCallback, useEffect, useState } from "react";
import type { EventItem } from "@/lib/events/types";

export function useEvents() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/events");
      if (!response.ok) {
        throw new Error("خطا در دریافت رویدادها");
      }
      const data = (await response.json()) as EventItem[];
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطای ناشناخته");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  return { events, loading, error, refetch: fetchEvents };
}

type AdminEventsResponse = {
  events: EventItem[];
};

export function useAdminEvents() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/events");
      if (!response.ok) {
        throw new Error("خطا در دریافت رویدادها");
      }
      const data = (await response.json()) as AdminEventsResponse;
      setEvents(data.events);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطای ناشناخته");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  return { events, loading, error, refetch: fetchEvents };
}
