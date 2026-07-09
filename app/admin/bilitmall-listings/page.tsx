"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminTableClasses } from "@/components/admin/admin-table-classes";
import {
  BILITMALL_LISTING_LABELS,
  MY_EVENT_EVENT_STATUS_LABELS,
} from "@/lib/my-event/constants";
import { cn } from "@/lib/utils";

type ListingRow = {
  id: number;
  slug: string;
  title: string;
  city: string;
  category: string;
  status: string;
  published: boolean;
  listOnBilitmallApproved: boolean;
  createdAt: string;
  organizer: {
    displayName: string;
    phone: string | null;
    slug: string;
  } | null;
};

export default function AdminBilitmallListingsPage() {
  const [events, setEvents] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/bilitmall-listings")
      .then((res) => res.json())
      .then((data) => setEvents(data))
      .finally(() => setLoading(false));
  }, []);

  async function handleAction(id: number, action: "approve" | "reject") {
    const res = await fetch("/api/admin/bilitmall-listings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "خطا");
      return;
    }

    setEvents((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              listOnBilitmallApproved: data.listOnBilitmallApproved,
            }
          : e
      )
    );

    if (action === "reject") {
      setEvents((prev) => prev.filter((e) => e.id !== id));
    }
  }

  return (
    <main
      className="min-h-screen bg-slate-50 p-4 text-slate-900 md:p-8 dark:bg-slate-950 dark:text-slate-100"
      dir="rtl"
    >
      <div className="mx-auto max-w-6xl">
        <Link href="/admin" className="mb-4 inline-block text-sm font-bold text-blue-600 dark:text-blue-400">
          ← بازگشت به پنل
        </Link>
        <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100">درخواست انتشار در بلیت‌مال</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          رویدادهایی که برگزارکننده خواسته در مارکت‌پلیس بلیت‌مال نمایش داده شوند
        </p>

        <div className={`mt-8 ${adminTableClasses.panel}`}>
          {loading ? (
            <p className={adminTableClasses.emptyInPanel}>در حال بارگذاری...</p>
          ) : events.length === 0 ? (
            <p className={adminTableClasses.emptyInPanel}>درخواستی ثبت نشده.</p>
          ) : (
            <div className={adminTableClasses.panelInner}>
              <table className={adminTableClasses.table}>
                <thead className={adminTableClasses.thead}>
                  <tr>
                    <th className={adminTableClasses.th}>رویداد</th>
                    <th className={adminTableClasses.th}>برگزارکننده</th>
                    <th className={adminTableClasses.th}>وضعیت My Event</th>
                    <th className={adminTableClasses.th}>بلیت‌مال</th>
                    <th className={adminTableClasses.th}>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id} className={adminTableClasses.tr}>
                      <td className={cn(adminTableClasses.td, adminTableClasses.tdAccent)}>
                      <div className="font-bold">{event.title}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {event.category} — {event.city}
                      </div>
                      </td>
                      <td className={adminTableClasses.td}>
                      <div className="font-bold">{event.organizer?.displayName ?? "—"}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400" dir="ltr">
                        {event.organizer?.phone ?? ""}
                      </div>
                      </td>
                      <td className={adminTableClasses.td}>
                      {MY_EVENT_EVENT_STATUS_LABELS[event.status] ?? event.status}
                      </td>
                      <td className={adminTableClasses.td}>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-bold ${
                          event.listOnBilitmallApproved
                            ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                        }`}
                      >
                        {event.listOnBilitmallApproved
                          ? BILITMALL_LISTING_LABELS.approved
                          : BILITMALL_LISTING_LABELS.pending}
                      </span>
                      </td>
                      <td className={adminTableClasses.td}>
                      {!event.listOnBilitmallApproved ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleAction(event.id, "approve")}
                            disabled={event.status !== "active" || !event.published}
                            className="rounded-lg bg-green-50 px-3 py-1 text-xs font-bold text-green-700 disabled:opacity-40 dark:bg-green-500/15 dark:text-green-300"
                            title={
                              event.status !== "active"
                                ? "ابتدا رویداد در My Event تأیید شود"
                                : undefined
                            }
                          >
                            تأیید انتشار
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAction(event.id, "reject")}
                            className="rounded-lg bg-red-50 px-3 py-1 text-xs font-bold text-red-700 dark:bg-red-500/15 dark:text-red-300"
                          >
                            رد
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-green-600 dark:text-green-400">منتشر شده</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
