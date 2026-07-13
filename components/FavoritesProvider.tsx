"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/components/AuthProvider";

type FavoritesContextType = {
  favoriteIds: Set<number>;
  loading: boolean;
  isFavorite: (eventId: number) => boolean;
  toggleFavorite: (eventId: number) => Promise<"added" | "removed" | "login_required">;
  refresh: () => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(() => new Set());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setFavoriteIds(new Set());
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/account/favorites?idsOnly=1", { cache: "no-store" });
      if (!response.ok) {
        setFavoriteIds(new Set());
        return;
      }
      const data = (await response.json()) as { ids?: number[] };
      setFavoriteIds(new Set(data.ids ?? []));
    } catch {
      setFavoriteIds(new Set());
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    if (!user) {
      const clearTimer = setTimeout(() => {
        setFavoriteIds(new Set());
        setLoading(false);
      }, 0);
      return () => clearTimeout(clearTimer);
    }

    void fetch("/api/account/favorites?idsOnly=1", { cache: "no-store" })
      .then(async (response) => {
        if (cancelled) return;
        if (!response.ok) {
          setFavoriteIds(new Set());
          return;
        }
        const data = (await response.json()) as { ids?: number[] };
        if (!cancelled) setFavoriteIds(new Set(data.ids ?? []));
      })
      .catch(() => {
        if (!cancelled) setFavoriteIds(new Set());
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  const isFavorite = useCallback(
    (eventId: number) => favoriteIds.has(eventId),
    [favoriteIds]
  );

  const toggleFavorite = useCallback(
    async (eventId: number): Promise<"added" | "removed" | "login_required"> => {
      if (!user) return "login_required";

      const wasFavorite = favoriteIds.has(eventId);
      const next = new Set(favoriteIds);
      if (wasFavorite) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      setFavoriteIds(next);

      try {
        const response = wasFavorite
          ? await fetch(`/api/account/favorites?eventId=${eventId}`, { method: "DELETE" })
          : await fetch("/api/account/favorites", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ eventId }),
            });

        if (!response.ok) {
          setFavoriteIds((current) => {
            const rollback = new Set(current);
            if (wasFavorite) rollback.add(eventId);
            else rollback.delete(eventId);
            return rollback;
          });
          throw new Error("favorite toggle failed");
        }

        return wasFavorite ? "removed" : "added";
      } catch {
        setFavoriteIds((current) => {
          const rollback = new Set(current);
          if (wasFavorite) rollback.add(eventId);
          else rollback.delete(eventId);
          return rollback;
        });
        throw new Error("favorite toggle failed");
      }
    },
    [favoriteIds, user]
  );

  const value = useMemo(
    () => ({
      favoriteIds,
      loading,
      isFavorite,
      toggleFavorite,
      refresh,
    }),
    [favoriteIds, loading, isFavorite, toggleFavorite, refresh]
  );

  return (
    <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}
