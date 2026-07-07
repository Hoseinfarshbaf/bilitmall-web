"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import MyEventShell from "@/components/my-event/MyEventShell";
import { buildPublicEventSlug } from "@/lib/my-event/public-slugs";
import { getMyEventPublicUrl } from "@/lib/my-event/auth";
import { MY_EVENT_EVENT_STATUS_LABELS, BILITMALL_LISTING_LABELS, MY_EVENT_SEATING_AFTER_APPROVAL_HINT, MY_EVENT_LINKED_VENUE_SEATING_HINT, isMyEventEventApproved, eventUsesLinkedVenueSeating } from "@/lib/my-event/constants";
import type { MyEventDashboardEvent, MyEventOrganizerProfile } from "@/lib/my-event/store";

export default function MyEventDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<MyEventOrganizerProfile | null>(null);
  const [events, setEvents] = useState<MyEventDashboardEvent[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadEvents() {
    const eventsRes = await fetch("/api/my-event/events");
    if (eventsRes.ok) setEvents(await eventsRes.json());
  }

  useEffect(() => {
    async function load() {
      try {
        const meRes = await fetch("/api/my-event/me");
        if (!meRes.ok) {
          router.replace("/my-event/login");
          return;
        }
        const meData = await meRes.json();
        setProfile(meData.organizer);
        await loadEvents();
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [router]);

  async function handleDelete(eventId: number, title: string) {
    if (!confirm(`رویداد «${title}» حذف شود؟`)) return;

    const res = await fetch(`/api/my-event/events/${eventId}`, { method: "DELETE" });
    if (!res.ok) {
      alert("خطا در حذف رویداد");
      return;
    }
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  }

  async function handleLogout() {
    await fetch("/api/my-event/auth/logout", { method: "POST" });
    router.replace("/my-event/login");
    router.refresh();
  }

  if (loading) {
    return (
      <MyEventShell>
        <p className="text-slate-400">در حال بارگذاری...</p>
      </MyEventShell>
    );
  }

  if (!profile) return null;

  const publicUrl = getMyEventPublicUrl(profile.slug);
  const canCreateEvents = profile.status === "active";
  const isOrganizerLive = profile.status === "active";

  return (
    <MyEventShell title={`سلام، ${profile.displayName}`}>
      {profile.status === "pending" ? (
        <div className="mb-6 rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5">
          <p className="font-bold text-amber-200">حساب شما در انتظار تأیید ادمین است</p>
          <p className="mt-2 text-sm text-slate-300">
            پس از تأیید می‌توانید رویداد ثبت کنید.
          </p>
        </div>
      ) : null}

      {isOrganizerLive ? (
        <div className="mb-8 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6">
          <p className="text-sm font-bold text-emerald-200">لینک صفحه شما</p>
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 block text-lg font-black text-white"
            dir="ltr"
          >
            {publicUrl}
          </a>
        </div>
      ) : (
        <div className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-400">
          لینک صفحه پس از تأیید حساب توسط ادمین فعال می‌شود.
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-3">
        {canCreateEvents ? (
          <Link
            href="/my-event/events/new"
            className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black hover:bg-emerald-500"
          >
            + رویداد جدید
          </Link>
        ) : (
          <span className="rounded-xl bg-white/5 px-5 py-3 text-sm font-bold text-slate-500">
            ثبت رویداد پس از تأیید حساب
          </span>
        )}
        <Link
          href="/my-event/profile"
          className="rounded-xl border border-white/15 px-5 py-3 text-sm font-black hover:bg-white/5"
        >
          ویرایش پروفایل
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-xl border border-white/15 px-5 py-3 text-sm font-bold text-slate-300 hover:bg-white/5"
        >
          خروج
        </button>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-black">رویدادهای شما</h2>
        {events.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-400">
            هنوز رویدادی ثبت نکرده‌اید.
          </p>
        ) : (
          events.map((event) => {
            const isApproved = isMyEventEventApproved(event);
            const usesLinkedVenue = eventUsesLinkedVenueSeating(event);
            const canDesignSeating = isApproved && event.hasAssignedSeating && !usesLinkedVenue;
            return (
              <div
                key={event.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <div>
                  <h3 className="font-black text-white">{event.title}</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    {event.category} — {event.place} — {event.city}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {event.hasAssignedSeating ? "صندلی مشخص" : "بدون صندلی ثابت"}
                    {event.hasAssignedSeating && usesLinkedVenue ? (
                      <span className="text-emerald-400"> · صحنه از سالن تأییدشده</span>
                    ) : event.hasAssignedSeating && event.hasSeatingPlan ? (
                      <span className="text-emerald-400"> · صحنه تعریف شده</span>
                    ) : null}
                    {event.hasAssignedSeating && !isApproved && !usesLinkedVenue ? (
                      <span className="text-violet-400"> · طراحی صحنه پس از تأیید</span>
                    ) : null}
                    {" · "}
                    {event.listOnBilitmallRequested
                      ? event.listOnBilitmallApproved
                        ? BILITMALL_LISTING_LABELS.approved
                        : BILITMALL_LISTING_LABELS.pending
                      : BILITMALL_LISTING_LABELS.notRequested}
                  </p>
                  <span
                    className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-bold ${
                      event.status === "active"
                        ? "bg-green-500/20 text-green-300"
                        : event.status === "pending"
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-red-500/20 text-red-300"
                    }`}
                  >
                    {MY_EVENT_EVENT_STATUS_LABELS[event.status] ?? event.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {canDesignSeating ? (
                    <Link
                      href={`/my-event/events/${event.id}/seating`}
                      className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold hover:bg-violet-500"
                    >
                      {event.hasSeatingPlan ? "ویرایش صحنه" : "ساخت صحنه"}
                    </Link>
                  ) : null}
                  {isApproved ? (
                    <a
                      href={getMyEventPublicUrl(
                        profile.slug,
                        event.publicEventSlug ?? buildPublicEventSlug(event.title)
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold hover:bg-white/15"
                    >
                      مشاهده صفحه
                    </a>
                  ) : (
                    <span className="max-w-xs rounded-xl bg-white/5 px-4 py-2 text-xs leading-6 text-slate-500">
                      {event.hasAssignedSeating && usesLinkedVenue
                        ? MY_EVENT_LINKED_VENUE_SEATING_HINT
                        : event.hasAssignedSeating
                          ? MY_EVENT_SEATING_AFTER_APPROVAL_HINT
                          : "لینک پس از تأیید ادمین فعال می‌شود."}
                    </span>
                  )}
                  <Link
                    href={`/my-event/events/${event.id}/edit`}
                    className="rounded-xl border border-white/15 px-4 py-2 text-sm font-bold hover:bg-white/5"
                  >
                    ویرایش
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(event.id, event.title)}
                    className="rounded-xl border border-red-500/30 px-4 py-2 text-sm font-bold text-red-300 hover:bg-red-500/10"
                  >
                    حذف
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </MyEventShell>
  );
}
