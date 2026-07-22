"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import MyEventShell from "@/components/my-event/MyEventShell";
import SeatingPlanEditor from "@/components/seating/SeatingPlanEditor";
import {
  MY_EVENT_DESIGN_SEATING_CTA,
  MY_EVENT_LINKED_VENUE_SEATING_HINT,
  MY_EVENT_VIEW_LINKED_VENUE_CTA,
} from "@/lib/my-event/constants";
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
  const [readOnly, setReadOnly] = useState(false);
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
      setReadOnly(data.readOnly === true);
      setLoading(false);
    }

    void load();
  }, [params, router]);

  async function handleSave(nextLayout: SeatingLayout) {
    if (!eventId || readOnly) return;
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
      setMessage(
        data.message ??
          "نقشه سالن ذخیره شد و برای تأیید ادمین ارسال شد. پس از تأیید، برای شهر شما پیشنهاد می‌شود."
      );
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
      <MyEventShell title="طراحی صحنه">
        <div className="max-w-xl space-y-4 rounded-3xl border border-violet-500/30 bg-violet-500/10 p-6">
          <p className="text-sm leading-7 text-violet-700 dark:text-violet-200">{blocked}</p>
          <Link
            href="/my-event/dashboard"
            className="inline-block rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white"
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

  const venueName = linkedVenue?.name || eventTitle;
  const pageTitle = readOnly
    ? MY_EVENT_VIEW_LINKED_VENUE_CTA(venueName)
    : `${MY_EVENT_DESIGN_SEATING_CTA} — ${eventTitle}`;

  return (
    <MyEventShell title={pageTitle}>
      {readOnly ? (
        <p className="mb-4 rounded-xl border border-brand-500/30 bg-brand-500/10 px-4 py-3 text-sm leading-7 text-brand-700 dark:text-brand-200">
          {MY_EVENT_LINKED_VENUE_SEATING_HINT}
        </p>
      ) : hasSeatingPlan ? (
        <p className="mb-4 rounded-xl border border-brand-500/30 bg-brand-500/10 px-4 py-3 text-sm font-bold leading-7 text-brand-700 dark:text-brand-200">
          ✓ صحنه ذخیره شد و در انتظار تأیید ادمین است. پس از تأیید، این سالن برای شهر شما در فهرست
          مکان‌های پیشنهادی قرار می‌گیرد.
        </p>
      ) : null}
      {message ? (
        <p className="mb-4 rounded-xl border border-brand-500/30 bg-brand-500/10 px-4 py-3 text-sm text-brand-700 dark:text-brand-200">
          {message}
        </p>
      ) : null}
      {!readOnly ? (
        <p className="mb-6 text-sm text-neutral-500 dark:text-slate-400">
          در استودیو می‌توانید چیدمان را بسازید و قیمت را برای همه صندلی‌ها یکسان، برای هر ردیف، یا
          برای هر صندلی جداگانه تنظیم کنید.
        </p>
      ) : null}
      <SeatingPlanEditor
        initialLayout={layout}
        onSave={readOnly ? undefined : handleSave}
        saving={saving}
        readOnly={readOnly}
        openLabel={
          readOnly
            ? MY_EVENT_VIEW_LINKED_VENUE_CTA(venueName)
            : "ورود به استودیو طراحی و قیمت‌گذاری"
        }
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
