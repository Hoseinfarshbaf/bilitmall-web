"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import MyEventShell from "@/components/my-event/MyEventShell";
import SeatingPlanEditor from "@/components/seating/SeatingPlanEditor";
import { MY_EVENT_LINKED_VENUE_SEATING_HINT } from "@/lib/my-event/constants";
import type { SeatingLayout } from "@/lib/seating/types";

export default function MyEventSeatingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [eventId, setEventId] = useState<number | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [layout, setLayout] = useState<SeatingLayout | null>(null);
  const [linkedVenue, setLinkedVenue] = useState<{ id: number; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [hasSeatingPlan, setHasSeatingPlan] = useState(false);
  const [blocked, setBlocked] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { id } = await params;
      const numId = Number(id);
      setEventId(numId);

      const res = await fetch(`/api/my-event/events/${numId}/seating`);
      const data = await res.json();

      if (res.status === 403) {
        setBlocked(data.error ?? MY_EVENT_LINKED_VENUE_SEATING_HINT);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        router.replace("/my-event/dashboard");
        return;
      }

      setEventTitle(data.eventTitle);
      setLayout(data.layout);
      setHasSeatingPlan(data.hasSeatingPlan === true);
      setLinkedVenue(data.linkedVenue ?? null);
      setLoading(false);
    }

    void load();
  }, [params, router]);

  async function handleSave(nextLayout: SeatingLayout) {
    if (!eventId) return;
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/my-event/events/${eventId}/seating`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layout: nextLayout }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "خطا در ذخیره");
      setLayout(nextLayout);
      setHasSeatingPlan(true);
      setMessage("نقشه سالن ذخیره شد. صحنه تعریف شده و می‌توانید هر زمان دوباره ویرایش کنید.");
    } catch (error) {
      alert(error instanceof Error ? error.message : "خطا در ذخیره");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <MyEventShell>
        <p className="text-neutral-500 dark:text-slate-400">در حال بارگذاری نقشه سالن...</p>
      </MyEventShell>
    );
  }

  if (blocked) {
    return (
      <MyEventShell title="ساخت صحنه">
        <div className="max-w-xl space-y-4 rounded-3xl border border-violet-500/30 bg-violet-500/10 p-6">
          <p className="text-sm leading-7 text-violet-700 dark:text-violet-200">{blocked}</p>
          <Link
            href="/my-event/dashboard"
            className="inline-block rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white"
          >
            بازگشت به داشبورد
          </Link>
        </div>
      </MyEventShell>
    );
  }

  if (!layout) {
    return (
      <MyEventShell>
        <p className="text-neutral-500 dark:text-slate-400">خطا در بارگذاری نقشه سالن.</p>
      </MyEventShell>
    );
  }

  return (
    <MyEventShell title={`ساخت صحنه — ${eventTitle}`}>
      {hasSeatingPlan ? (
        <p className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-700 dark:text-emerald-200">
          ✓ صحنه تعریف شده — برای تغییر نقشه، ویرایش کنید و دوباره ذخیره بزنید.
        </p>
      ) : null}
      {message ? (
        <p className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-200">
          {message}
        </p>
      ) : null}
      <p className="mb-6 text-sm text-neutral-500 dark:text-slate-400">
        روی «ورود به استودیو طراحی» کلیک کنید تا صحنه، بالکن‌ها و صندلی‌ها را با شماره ردیف مشخص
        طراحی کنید.
      </p>
      {linkedVenue && !hasSeatingPlan ? (
        <p className="mb-4 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-700 dark:text-blue-200">
          نقشه اولیه از سالن «{linkedVenue.name}» بارگذاری شده — در صورت نیاز می‌توانید ویرایش کنید.
        </p>
      ) : null}
      <SeatingPlanEditor
        initialLayout={layout}
        onSave={handleSave}
        saving={saving}
      />
      <Link
        href={eventId != null ? `/my-event/events/${eventId}/edit` : "/my-event/dashboard"}
        className="mt-6 inline-block text-sm font-bold text-neutral-500 hover:text-neutral-900 dark:text-slate-400 dark:hover:text-white"
      >
        ← بازگشت به ویرایش رویداد
      </Link>
    </MyEventShell>
  );
}
