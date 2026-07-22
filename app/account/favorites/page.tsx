"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AccountNav from "@/components/account/AccountNav";
import AccountShell from "@/components/account/AccountShell";
import EventCard from "@/components/EventCard";
import { useAuth } from "@/components/AuthProvider";
import { useFavorites } from "@/components/FavoritesProvider";
import type { EventItem } from "@/lib/events/types";

type UserProfile = {
  id: number;
  name: string;
  phone: string;
};

export default function AccountFavoritesPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const { favoriteIds } = useFavorites();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  const visibleEvents = events.filter((event) => favoriteIds.has(event.id));

  useEffect(() => {
    async function load() {
      try {
        const meRes = await fetch("/api/auth/me");
        if (!meRes.ok) {
          router.replace("/auth/login?next=/account/favorites");
          return;
        }
        const meData = await meRes.json();
        setUser(meData.user);

        const favoritesRes = await fetch("/api/account/favorites");
        if (favoritesRes.ok) {
          const data = (await favoritesRes.json()) as { events?: EventItem[] };
          setEvents(data.events ?? []);
        }
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [router]);

  async function handleLogout() {
    await logout();
    router.replace("/");
    router.refresh();
  }

  if (loading) {
    return (
      <AccountShell>
        <p className="text-neutral-500">در حال بارگذاری...</p>
      </AccountShell>
    );
  }

  if (!user) return null;

  return (
    <AccountShell title={`سلام، ${user.name}`}>
      <AccountNav />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-neutral-500" dir="ltr">
          {user.phone}
        </p>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-bold text-neutral-600 hover:bg-neutral-100"
        >
          خروج
        </button>
      </div>

      <h2 className="mb-2 text-xl font-black">علاقه‌مندی‌ها</h2>
      <p className="mb-6 text-sm text-neutral-500">
        رویدادهایی که با علامت قلب ذخیره کرده‌اید.
      </p>

      {visibleEvents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center">
          <p className="text-neutral-500">هنوز رویدادی به علاقه‌مندی‌ها اضافه نکرده‌اید.</p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-full bg-brand-500 px-5 py-2 text-sm font-bold text-white"
          >
            کشف رویدادها
          </Link>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {visibleEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </AccountShell>
  );
}
