"use client";

import { useCallback, useEffect, useState } from "react";
import type { EventItem } from "@/lib/events/types";

async function fetchPublicEvents(): Promise<{ events: EventItem[]; error: string | null }> {
  try {
    const response = await fetch("/api/events");
    if (!response.ok) {
      throw new Error("خطا در دریافت رویدادها");
    }
    const data = (await response.json()) as EventItem[];
    return { events: data, error: null };
  } catch (err) {
    return {
      events: [],
      error: err instanceof Error ? err.message : "خطای ناشناخته",
    };
  }
}

export function useEvents() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await fetchPublicEvents();
    setEvents(result.events);
    setError(result.error);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    void fetchPublicEvents().then((result) => {
      if (cancelled) return;
      setEvents(result.events);
      setError(result.error);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { events, loading, error, refetch: fetchEvents };
}

type AdminEventsResponse = {
  events: EventItem[];
};

async function fetchAdminEvents(): Promise<{ events: EventItem[]; error: string | null }> {
  try {
    const response = await fetch("/api/admin/events");
    if (!response.ok) {
      throw new Error("خطا در دریافت رویدادها");
    }
    const data = (await response.json()) as AdminEventsResponse;
    return { events: data.events, error: null };
  } catch (err) {
    return {
      events: [],
      error: err instanceof Error ? err.message : "خطای ناشناخته",
    };
  }
}

export function useAdminEvents() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await fetchAdminEvents();
    setEvents(result.events);
    setError(result.error);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    void fetchAdminEvents().then((result) => {
      if (cancelled) return;
      setEvents(result.events);
      setError(result.error);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { events, loading, error, refetch: fetchEvents };
}
