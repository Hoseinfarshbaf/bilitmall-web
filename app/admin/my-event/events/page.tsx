"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import AdminBackLink from "@/components/admin/AdminBackLink";
import { adminTableClasses } from "@/components/admin/admin-table-classes";
import { getMyEventPublicUrl } from "@/lib/my-event/auth";
import { buildPublicEventSlug } from "@/lib/my-event/public-slugs";
import {
  BILITMALL_LISTING_LABELS,
  MY_EVENT_EVENT_STATUS_LABELS,
  MY_EVENT_PENDING_CHANGE_LABELS,
  MY_EVENT_STATUS_LABELS,
} from "@/lib/my-event/constants";
import { formatAdminDateTime } from "@/lib/admin/format-datetime";
import { cn } from "@/lib/utils";

type EventRow = {
  id: number;
  slug: string;
  title: string;
  city: string;
  publicEventSlug: string | null;
  publicCitySlug: string | null;
  status: string;
  published: boolean;
  listOnBilitmallRequested: boolean;
  listOnBilitmallApproved: boolean;
  hasPendingChanges: boolean;
  pendingEventChanges: boolean;
  pendingVenueChanges: boolean;
  createdAt: string;
  organizer: {
    id: number;
    slug: string;
    displayName: string;
    status: string;
    phone: string | null;
  } | null;
};

type EventStatusFilter = "all" | "pending" | "pending_edits" | "published" | "rejected";
type BilitmallFilter = "all" | "not_requested" | "pending" | "approved";

const EVENT_STATUS_OPTIONS: { value: EventStatusFilter; label: string }[] = [
  { value: "all", label: "همه وضعیت‌ها" },
  { value: "pending", label: "در انتظار تأیید (ثبت اولیه)" },
  { value: "pending_edits", label: "ویرایش‌شده در انتظار تأیید" },
  { value: "published", label: "تأیید / منتشر شده" },
  { value: "rejected", label: "رد شده" },
];

const BILITMALL_FILTER_OPTIONS: { value: BilitmallFilter; label: string }[] = [
  { value: "all", label: "همه — بلیت‌مال" },
  { value: "not_requested", label: "بدون درخواست بلیت‌مال" },
  { value: "pending", label: "بلیت‌مال — در انتظار تأیید" },
  { value: "approved", label: "بلیت‌مال — منتشر شده" },
];

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

function parseBilitmallFilter(value: string | null): BilitmallFilter {
  if (value === "not_requested" || value === "pending" || value === "approved") {
    return value;
  }
  return "all";
}

function matchesEventStatusFilter(event: EventRow, filter: EventStatusFilter): boolean {
  if (filter === "all") return true;
  if (filter === "pending") {
    return event.status === "pending" && !event.hasPendingChanges;
  }
  if (filter === "pending_edits") {
    return event.status === "pending" && event.hasPendingChanges;
  }
  if (filter === "published") return event.status === "active" && event.published;
  if (filter === "rejected") return event.status === "rejected";
  return true;
}

function matchesBilitmallFilter(event: EventRow, filter: BilitmallFilter): boolean {
  if (filter === "all") return true;
  if (filter === "not_requested") return !event.listOnBilitmallRequested;
  if (filter === "pending") {
    return event.listOnBilitmallRequested && !event.listOnBilitmallApproved;
  }
  if (filter === "approved") return event.listOnBilitmallApproved;
  return true;
}

function AdminMyEventEventsPageContent() {
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<EventRow | null>(null);
  const [approvePage, setApprovePage] = useState(true);
  const [approveBilitmall, setApproveBilitmall] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<EventStatusFilter>("all");
  const [bilitmallFilter, setBilitmallFilter] = useState<BilitmallFilter>(() =>
    parseBilitmallFilter(searchParams.get("bilitmall"))
  );

  useEffect(() => {
    setBilitmallFilter(parseBilitmallFilter(searchParams.get("bilitmall")));
  }, [searchParams]);

  useEffect(() => {
    fetch("/api/admin/my-event/events")
      .then((res) => res.json())
      .then((data) => setEvents(data))
      .finally(() => setLoading(false));
  }, []);

  const pendingBilitmallCount = useMemo(
    () =>
      events.filter((e) => e.listOnBilitmallRequested && !e.listOnBilitmallApproved).length,
    [events]
  );

  const pendingFirstSubmitCount = useMemo(
    () => events.filter((e) => e.status === "pending" && !e.hasPendingChanges).length,
    [events]
  );

  const pendingEditsCount = useMemo(
    () => events.filter((e) => e.status === "pending" && e.hasPendingChanges).length,
    [events]
  );

  const rejectedCount = useMemo(
    () => events.filter((e) => e.status === "rejected").length,
    [events]
  );

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return events.filter((event) => {
      if (!matchesEventStatusFilter(event, statusFilter)) return false;
      if (!matchesBilitmallFilter(event, bilitmallFilter)) return false;
      if (!query) return true;
      const haystack = [
        event.title,
        event.city,
        event.organizer?.displayName ?? "",
        event.organizer?.phone ?? "",
        event.organizer?.slug ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [events, search, statusFilter, bilitmallFilter]);

  function openApproveModal(event: EventRow) {
    setApproving(event);
    setApprovePage(event.status !== "active");
    setApproveBilitmall(
      event.listOnBilitmallRequested && !event.listOnBilitmallApproved
    );
  }

  async function submitApprove(e: React.FormEvent) {
    e.preventDefault();
    if (!approving) return;
    setSaving(true);

    try {
      const res = await fetch("/api/admin/my-event/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: approving.id,
          action: "approve",
          approveMyEventPage: approvePage,
          approveBilitmall: approveBilitmall,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "خطا");

      setEvents((prev) =>
        prev.map((item) =>
          item.id === approving.id
            ? {
                ...item,
                status: data.status,
                published: data.published,
                listOnBilitmallApproved: data.listOnBilitmallApproved,
                hasPendingChanges: false,
                pendingEventChanges: false,
                pendingVenueChanges: false,
              }
            : item
        )
      );
      setApproving(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "خطا");
    } finally {
      setSaving(false);
    }
  }

  async function handleReject(id: number) {
    if (!confirm("رویداد رد شود؟")) return;

    const res = await fetch("/api/admin/my-event/events", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "reject" }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "خطا");
      return;
    }

    setEvents((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: data.status,
              published: data.published,
              listOnBilitmallApproved: false,
              hasPendingChanges: false,
              pendingEventChanges: false,
              pendingVenueChanges: false,
            }
          : item
      )
    );

    if (confirm("رویداد رد شد. می‌خواهید از لیست به‌طور کامل حذف شود؟")) {
      await deleteEvent(id, true);
    }
  }

  async function approveBilitmallOnly(id: number) {
    if (!confirm("انتشار این رویداد در بلیت‌مال تأیید شود؟")) return;

    const res = await fetch("/api/admin/my-event/events", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "approve_bilitmall" }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "خطا");
      return;
    }

    setEvents((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              listOnBilitmallApproved: data.listOnBilitmallApproved,
              listOnBilitmallRequested: data.listOnBilitmallRequested ?? true,
            }
          : item
      )
    );
  }

  async function rejectBilitmallOnly(id: number) {
    if (!confirm("درخواست انتشار در بلیت‌مال رد شود؟ (صفحه اختصاصی My Event باقی می‌ماند)")) {
      return;
    }

    const res = await fetch("/api/admin/my-event/events", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "reject_bilitmall" }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "خطا");
      return;
    }

    setEvents((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              listOnBilitmallApproved: false,
              listOnBilitmallRequested: data.listOnBilitmallRequested ?? false,
            }
          : item
      )
    );
  }

  async function deleteEvent(id: number, skipConfirm = false) {
    if (!skipConfirm && !confirm("رویداد به‌طور کامل حذف شود؟ (از لینک اختصاصی و بلیت‌مال)")) {
      return;
    }

    const res = await fetch("/api/admin/my-event/events", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "delete" }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "خطا");
      return;
    }

    setEvents((prev) => prev.filter((item) => item.id !== id));
  }

  async function handleRemoveFromBilitmall(id: number) {
    if (!confirm("رویداد از سایت بلیت‌مال حذف شود؟ (لینک اختصاصی My Event باقی می‌ماند)")) {
      return;
    }

    const res = await fetch("/api/admin/my-event/events", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "remove_from_bilitmall" }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "خطا");
      return;
    }

    setEvents((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, listOnBilitmallApproved: false } : item
      )
    );
  }

  const needsBilitmallReview = (event: EventRow) =>
    event.listOnBilitmallRequested && !event.listOnBilitmallApproved;

  return (
    <main
      className="min-h-screen bg-slate-50 p-4 text-slate-900 md:p-8 dark:bg-slate-950 dark:text-slate-100"
      dir="rtl"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex flex-wrap gap-2">
          <AdminBackLink className="mb-0" />
          <AdminBackLink
            href="/admin/my-event"
            label="بازگشت به برگزارکنندگان"
            className="mb-0"
          />
        </div>
        <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100">
          رویدادهای My Event
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          تأیید صفحه اختصاصی، بررسی و فیلتر درخواست انتشار در بلیت‌مال، و حذف کامل رویدادهای ردشده
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setBilitmallFilter("all");
              setStatusFilter("pending");
            }}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-bold transition",
              statusFilter === "pending"
                ? "bg-amber-500 text-white"
                : "bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
            )}
          >
            ثبت اولیه در انتظار ({pendingFirstSubmitCount})
          </button>
          <button
            type="button"
            onClick={() => {
              setBilitmallFilter("all");
              setStatusFilter("pending_edits");
            }}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-bold transition",
              statusFilter === "pending_edits"
                ? "bg-orange-500 text-white"
                : "bg-orange-50 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300"
            )}
          >
            ویرایش‌شده در انتظار ({pendingEditsCount})
          </button>
          <button
            type="button"
            onClick={() => {
              setStatusFilter("all");
              setBilitmallFilter("pending");
            }}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-bold transition",
              bilitmallFilter === "pending"
                ? "bg-amber-500 text-white"
                : "bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
            )}
          >
            بلیت‌مال در انتظار ({pendingBilitmallCount})
          </button>
          <button
            type="button"
            onClick={() => {
              setBilitmallFilter("all");
              setStatusFilter("rejected");
            }}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-bold transition",
              statusFilter === "rejected"
                ? "bg-brand-500 text-white"
                : "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
            )}
          >
            رد شده ({rejectedCount})
          </button>
          <button
            type="button"
            onClick={() => {
              setStatusFilter("all");
              setBilitmallFilter("all");
            }}
            className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          >
            پاک کردن فیلتر
          </button>
        </div>

        <div className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="md:col-span-3">
            <label className="mb-1 block text-xs font-bold text-slate-500 dark:text-slate-400">
              جستجو
            </label>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="عنوان رویداد، برگزارکننده، شهر یا شماره موبایل..."
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-500 dark:text-slate-400">
              وضعیت رویداد
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as EventStatusFilter)}
              className={inputClass}
            >
              {EVENT_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-500 dark:text-slate-400">
              انتشار در بلیت‌مال
            </label>
            <select
              value={bilitmallFilter}
              onChange={(e) => setBilitmallFilter(e.target.value as BilitmallFilter)}
              className={inputClass}
            >
              {BILITMALL_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          {loading
            ? "در حال بارگذاری..."
            : `${filteredEvents.length} از ${events.length} رویداد`}
        </p>

        <div className={`mt-4 ${adminTableClasses.panel}`}>
          {loading ? (
            <p className={adminTableClasses.emptyInPanel}>در حال بارگذاری...</p>
          ) : events.length === 0 ? (
            <p className={adminTableClasses.emptyInPanel}>رویدادی ثبت نشده.</p>
          ) : filteredEvents.length === 0 ? (
            <p className={adminTableClasses.emptyInPanel}>نتیجه‌ای با این فیلتر یافت نشد.</p>
          ) : (
            <div className={adminTableClasses.panelInner}>
              <table className={adminTableClasses.table}>
                <thead className={adminTableClasses.thead}>
                  <tr>
                    <th className={adminTableClasses.th}>رویداد</th>
                    <th className={adminTableClasses.th}>برگزارکننده</th>
                    <th className={adminTableClasses.th}>تاریخ درخواست رویداد</th>
                    <th className={adminTableClasses.th}>درخواست‌ها</th>
                    <th className={adminTableClasses.th}>وضعیت</th>
                    <th className={adminTableClasses.th}>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((event) => (
                    <tr key={event.id} className={adminTableClasses.tr}>
                      <td className={cn(adminTableClasses.td, adminTableClasses.tdAccent)}>
                        <div className="font-bold">{event.title}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {event.city}
                        </div>
                      </td>
                      <td className={adminTableClasses.td}>
                        {event.organizer ? (
                          <>
                            <div className="font-bold">{event.organizer.displayName}</div>
                            <div
                              className="text-xs text-slate-500 dark:text-slate-400"
                              dir="ltr"
                            >
                              {event.organizer.phone ?? "—"}
                            </div>
                            <div className="text-xs text-slate-400 dark:text-slate-500">
                              {MY_EVENT_STATUS_LABELS[event.organizer.status] ??
                                event.organizer.status}
                            </div>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td
                        className={`${adminTableClasses.td} text-xs text-slate-600 whitespace-nowrap dark:text-slate-400`}
                      >
                        {formatAdminDateTime(event.createdAt)}
                      </td>
                      <td className={`${adminTableClasses.td} text-xs`}>
                        <div>صفحه اختصاصی ✓</div>
                        <div
                          className={
                            needsBilitmallReview(event)
                              ? "font-bold text-amber-700 dark:text-amber-400"
                              : event.listOnBilitmallApproved
                                ? "text-brand-700 dark:text-brand-400"
                                : "text-slate-400 dark:text-slate-500"
                          }
                        >
                          بلیت‌مال:{" "}
                          {event.listOnBilitmallRequested
                            ? event.listOnBilitmallApproved
                              ? BILITMALL_LISTING_LABELS.approved
                              : BILITMALL_LISTING_LABELS.pending
                            : "—"}
                        </div>
                      </td>
                      <td className={adminTableClasses.td}>
                        <div className="space-y-1">
                          <span
                            className={`inline-block rounded-full px-2 py-1 text-xs font-bold ${
                              event.status === "active"
                                ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300"
                                : event.status === "pending"
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                                  : "bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300"
                            }`}
                          >
                            {MY_EVENT_EVENT_STATUS_LABELS[event.status] ?? event.status}
                          </span>
                          {event.status === "pending" && event.pendingEventChanges ? (
                            <div className="text-[11px] font-bold text-orange-700 dark:text-orange-300">
                              {MY_EVENT_PENDING_CHANGE_LABELS.event}
                            </div>
                          ) : null}
                          {event.status === "pending" && event.pendingVenueChanges ? (
                            <div className="text-[11px] font-bold text-orange-700 dark:text-orange-300">
                              {MY_EVENT_PENDING_CHANGE_LABELS.venue}
                            </div>
                          ) : null}
                        </div>
                      </td>
                      <td className={adminTableClasses.td}>
                        <div className="flex flex-wrap gap-2">
                          {event.status === "pending" ? (
                            <>
                              <button
                                type="button"
                                onClick={() => openApproveModal(event)}
                                className="rounded-lg bg-green-50 px-3 py-1 text-xs font-bold text-green-700 dark:bg-green-500/15 dark:text-green-300"
                              >
                                تأیید / انتخاب کانال
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReject(event.id)}
                                className="rounded-lg bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
                              >
                                رد
                              </button>
                            </>
                          ) : null}

                          {event.status === "active" && needsBilitmallReview(event) ? (
                            <>
                              <button
                                type="button"
                                onClick={() => approveBilitmallOnly(event.id)}
                                className="rounded-lg bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
                              >
                                تأیید بلیت‌مال
                              </button>
                              <button
                                type="button"
                                onClick={() => rejectBilitmallOnly(event.id)}
                                className="rounded-lg bg-orange-50 px-3 py-1 text-xs font-bold text-orange-800 dark:bg-orange-500/15 dark:text-orange-300"
                              >
                                رد بلیت‌مال
                              </button>
                            </>
                          ) : null}

                          {event.status === "pending" && needsBilitmallReview(event) ? (
                            <button
                              type="button"
                              onClick={() => rejectBilitmallOnly(event.id)}
                              className="rounded-lg bg-orange-50 px-3 py-1 text-xs font-bold text-orange-800 dark:bg-orange-500/15 dark:text-orange-300"
                            >
                              رد بلیت‌مال
                            </button>
                          ) : null}

                          {event.organizer && event.status === "active" ? (
                            <a
                              href={getMyEventPublicUrl(
                                event.organizer.slug,
                                event.publicEventSlug ?? buildPublicEventSlug(event.title)
                              )}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            >
                              مشاهده لینک
                            </a>
                          ) : null}

                          {event.status === "active" && event.listOnBilitmallApproved ? (
                            <button
                              type="button"
                              onClick={() => handleRemoveFromBilitmall(event.id)}
                              className="rounded-lg bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
                            >
                              حذف از بلیت‌مال
                            </button>
                          ) : null}

                          {event.status === "rejected" ||
                          event.status === "active" ||
                          event.listOnBilitmallApproved ? (
                            <button
                              type="button"
                              onClick={() => deleteEvent(event.id)}
                              className="rounded-lg bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
                            >
                              {event.status === "rejected"
                                ? "حذف کامل از لیست"
                                : "حذف کامل رویداد"}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {approving ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={submitApprove}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 dark:text-slate-100"
          >
            <h2 className="text-lg font-black">تأیید «{approving.title}»</h2>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              کانال‌هایی که می‌خواهید فعال شوند:
            </p>
            <div className="mt-4 space-y-3">
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                <input
                  type="checkbox"
                  checked={approvePage}
                  onChange={(e) => setApprovePage(e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm font-bold">صفحه اختصاصی (لینک My Event)</span>
              </label>
              {approving.listOnBilitmallRequested ? (
                <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  <input
                    type="checkbox"
                    checked={approveBilitmall}
                    onChange={(e) => setApproveBilitmall(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm font-bold">انتشار در سایت بلیت‌مال</span>
                </label>
              ) : (
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  درخواست انتشار در بلیت‌مال ثبت نشده.
                </p>
              )}
            </div>
            <div className="mt-6 flex gap-2">
              <button
                type="submit"
                disabled={saving || (!approvePage && !approveBilitmall)}
                className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                {saving ? "..." : "تأیید"}
              </button>
              <button
                type="button"
                onClick={() => setApproving(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold dark:border-slate-700"
              >
                انصراف
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}

export default function AdminMyEventEventsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 p-4 text-slate-900 md:p-8 dark:bg-slate-950 dark:text-slate-100">
          <p className="text-center text-slate-500 dark:text-slate-400">در حال بارگذاری...</p>
        </main>
      }
    >
      <AdminMyEventEventsPageContent />
    </Suspense>
  );
}
