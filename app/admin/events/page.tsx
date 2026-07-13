"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import EventForm from "@/components/admin/EventForm";
import EventAdminStatsPanel from "@/components/admin/EventAdminStatsPanel";
import EventScheduleCell from "@/components/admin/EventScheduleCell";
import EventStatusBadge from "@/components/admin/EventStatusBadge";
import { adminTableClasses } from "@/components/admin/admin-table-classes";
import CityAutocomplete from "@/components/CityAutocomplete";
import { useAdminEvents } from "@/hooks/useEvents";
import {
  EVENT_CATEGORIES,
  type EventFormData,
  type EventItem,
} from "@/lib/events/types";
import {
  EVENT_STATUS_LABELS,
  resolveEventStatus,
} from "@/lib/events/status";
import {
  eventMatchesDateFilter,
  getUpcomingEventSchedule,
} from "@/lib/events/date-utils";
import { resolveFormPrice } from "@/lib/events/pricing";
import EventFramedImage from "@/components/EventFramedImage";
import EventOriginBadge from "@/components/admin/EventOriginBadge";
import {
  EXTERNAL_SITE_LABELS,
  OWNERSHIP_LABELS,
  eventMatchesOwnershipFilter,
  eventMatchesSiteFilter,
  type OwnershipFilter,
  type SiteFilter,
} from "@/lib/events/admin-origin";
import { getEventUrl } from "@/lib/events/helpers";
import { cn } from "@/lib/utils";

type ViewMode = "list" | "create" | "edit";
type HighlightFilter = "همه" | "popular" | "featured" | "both";

function AdminEventsPageContent() {
  const searchParams = useSearchParams();
  const { events, loading, error, refetch } = useAdminEvents();
  const initialImportUrl = searchParams.get("importUrl") ?? "";
  const createFromUrl = searchParams.get("create") === "1";

  const [view, setView] = useState<ViewMode>(() => (createFromUrl ? "create" : "list"));
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [trackedCreateFromUrl, setTrackedCreateFromUrl] = useState(createFromUrl);
  if (createFromUrl !== trackedCreateFromUrl) {
    setTrackedCreateFromUrl(createFromUrl);
    if (createFromUrl) {
      setSelectedEvent(null);
      setView("create");
    }
  }

  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("همه");
  const [categoryFilter, setCategoryFilter] = useState("همه");
  const [statusFilter, setStatusFilter] = useState("همه");
  const [dateFilter, setDateFilter] = useState<DateObject | null>(null);
  const [highlightFilter, setHighlightFilter] = useState<HighlightFilter>("همه");
  const [ownershipFilter, setOwnershipFilter] = useState<OwnershipFilter>("همه");
  const [siteFilter, setSiteFilter] = useState<SiteFilter>("همه");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const dateFilterValue = dateFilter?.format("YYYY/MM/DD") ?? "";

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchSearch =
        event.title.includes(searchQuery) ||
        event.place.includes(searchQuery) ||
        event.city.includes(searchQuery);
      const matchCity = cityFilter === "همه" || event.city === cityFilter;
      const matchCategory =
        categoryFilter === "همه" || event.category === categoryFilter;
      const resolvedStatus = resolveEventStatus(event);
      const matchStatus =
        statusFilter === "همه" || statusFilter === resolvedStatus;
      const matchDate = eventMatchesDateFilter(event, dateFilterValue);
      const matchHighlight =
        highlightFilter === "همه" ||
        (highlightFilter === "popular" && event.popular === true) ||
        (highlightFilter === "featured" && event.featured === true) ||
        (highlightFilter === "both" &&
          event.popular === true &&
          event.featured === true);
      const matchOwnership = eventMatchesOwnershipFilter(event, ownershipFilter);
      const matchSite = eventMatchesSiteFilter(event, siteFilter);

      return (
        matchSearch &&
        matchCity &&
        matchCategory &&
        matchStatus &&
        matchDate &&
        matchHighlight &&
        matchOwnership &&
        matchSite
      );
    });
  }, [
    events,
    searchQuery,
    cityFilter,
    categoryFilter,
    statusFilter,
    dateFilterValue,
    highlightFilter,
    ownershipFilter,
    siteFilter,
  ]);

  const filteredEventIds = useMemo(
    () => filteredEvents.map((event) => event.id),
    [filteredEvents]
  );

  const selectedCount = selectedIds.size;
  const allFilteredSelected =
    filteredEventIds.length > 0 &&
    filteredEventIds.every((id) => selectedIds.has(id));
  const someFilteredSelected =
    filteredEventIds.some((id) => selectedIds.has(id)) && !allFilteredSelected;

  useEffect(() => {
    const input = selectAllRef.current;
    if (input) {
      input.indeterminate = someFilteredSelected;
    }
  }, [someFilteredSelected]);

  const toggleEventSelection = (eventId: number) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allFilteredSelected) {
        for (const id of filteredEventIds) {
          next.delete(id);
        }
      } else {
        for (const id of filteredEventIds) {
          next.add(id);
        }
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const openCreate = () => {
    setSelectedEvent(null);
    setView("create");
  };

  const openEdit = (event: EventItem) => {
    setSelectedEvent(event);
    setView("edit");
  };

  const backToList = () => {
    setView("list");
    setSelectedEvent(null);
  };

  const handleSubmit = async (formData: EventFormData, imageFile: File | null, bannerImageFile: File | null) => {
    setSubmitting(true);

    try {
      const payload = new FormData();
      payload.append("title", formData.title);
      payload.append("city", formData.city);
      payload.append("category", formData.category);
      payload.append("place", formData.place);
      payload.append("placeAddress", formData.placeAddress ?? "");
      if (formData.venueTemplateId != null) {
        payload.append("venueTemplateId", String(formData.venueTemplateId));
      } else {
        payload.append("venueTemplateId", "");
      }
      payload.append("price", resolveFormPrice(formData));
      payload.append("imageUrl", formData.image);
      payload.append("bannerImageUrl", formData.bannerImage);
      payload.append("badge", formData.badge);
      payload.append("days", JSON.stringify(formData.days));
      payload.append("published", String(formData.published));
      payload.append("popular", String(formData.popular));
      payload.append("featured", String(formData.featured));
      payload.append("status", formData.status);
      if (formData.ticketingType) {
        payload.append("ticketingType", formData.ticketingType);
      }
      if (formData.hasAssignedSeating !== null) {
        payload.append("hasAssignedSeating", String(formData.hasAssignedSeating));
      }
      if (formData.pricingMode) {
        payload.append("pricingMode", formData.pricingMode);
      }
      payload.append("fixedPriceAmount", formData.fixedPriceAmount);

      if (imageFile) {
        payload.append("image", imageFile);
      }

      if (bannerImageFile) {
        payload.append("bannerImage", bannerImageFile);
      }

      const response = await fetch(
        selectedEvent ? `/api/events/${selectedEvent.id}` : "/api/events",
        {
          method: selectedEvent ? "PUT" : "POST",
          body: payload,
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "خطا در ذخیره رویداد");
      }

      await refetch();
      backToList();
    } catch (err) {
      alert(err instanceof Error ? err.message : "خطا در ذخیره رویداد");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (event: EventItem) => {
    if (!confirm(`رویداد «${event.title}» به‌طور کامل حذف شود؟`)) return;

    const response = await fetch(`/api/events/${event.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const data = await response.json();
      alert(data.error ?? "خطا در حذف رویداد");
      return;
    }

    await refetch();
    setSelectedIds((current) => {
      if (!current.has(event.id)) return current;
      const next = new Set(current);
      next.delete(event.id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedCount === 0) return;

    const ids = [...selectedIds];
    if (
      !confirm(
        `${ids.length.toLocaleString("fa-IR")} رویداد انتخاب‌شده به‌طور کامل حذف شوند؟ این عمل قابل بازگشت نیست.`
      )
    ) {
      return;
    }

    setBulkDeleting(true);

    try {
      const response = await fetch("/api/admin/events/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "خطا در حذف گروهی رویدادها");
      }

      clearSelection();
      await refetch();

      if (data.notFound?.length > 0) {
        alert(
          `${data.deleted.toLocaleString("fa-IR")} رویداد حذف شد؛ ${data.notFound.length.toLocaleString("fa-IR")} مورد یافت نشد.`
        );
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "خطا در حذف گروهی رویدادها");
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <main
      className="min-h-screen bg-slate-50 p-4 text-slate-900 md:p-8 dark:bg-slate-950 dark:text-slate-100"
      dir="rtl"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              href="/admin"
              className="mb-2 inline-block text-sm font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              ← بازگشت به پنل
            </Link>
            <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100">مدیریت رویدادها</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              تعریف، ویرایش، فیلتر و انتشار رویدادها
            </p>
          </div>

          {view === "list" && (
            <button
              type="button"
              onClick={openCreate}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              + رویداد جدید
            </button>
          )}
        </div>

        {view === "list" ? (
          <div className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
                <div className="min-w-0">
                  <input
                    type="text"
                    placeholder="جستجو..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div className="min-w-0 rounded-xl border border-slate-200 p-2 focus-within:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:[&_input]:text-slate-100">
                  <DatePicker
                    value={dateFilter}
                    onChange={(date) => setDateFilter((date as DateObject) ?? null)}
                    calendar={persian}
                    locale={persian_fa}
                    calendarPosition="bottom-right"
                    format="YYYY/MM/DD"
                    inputClass="w-full outline-none p-1.5 text-sm bg-transparent"
                    placeholder="فیلتر تاریخ"
                  />
                </div>
                <div className="min-w-0">
                  <CityAutocomplete
                    includeAllCities
                    includeAll
                    value={cityFilter}
                    onChange={setCityFilter}
                  />
                </div>
                <div className="min-w-0">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="همه">همه دسته‌ها</option>
                    {EVENT_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="min-w-0">
                  <select
                    value={highlightFilter}
                    onChange={(e) =>
                      setHighlightFilter(e.target.value as HighlightFilter)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="همه">همه نمایش‌ها</option>
                    <option value="popular">فقط محبوب</option>
                    <option value="featured">فقط ویژه</option>
                    <option value="both">محبوب و ویژه</option>
                  </select>
                </div>
                <div className="min-w-0">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="همه">همه وضعیت‌ها</option>
                    <option value="active">{EVENT_STATUS_LABELS.active}</option>
                    <option value="sold_out">{EVENT_STATUS_LABELS.sold_out}</option>
                    <option value="cancelled">{EVENT_STATUS_LABELS.cancelled}</option>
                    <option value="draft">{EVENT_STATUS_LABELS.draft}</option>
                  </select>
                </div>
                <div className="min-w-0">
                  <select
                    value={ownershipFilter}
                    onChange={(e) => setOwnershipFilter(e.target.value as OwnershipFilter)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="همه">همه مالکیت‌ها</option>
                    <option value="bilitmall">{OWNERSHIP_LABELS.bilitmall}</option>
                    <option value="linked">{OWNERSHIP_LABELS.linked}</option>
                    <option value="organizer">{OWNERSHIP_LABELS.organizer}</option>
                  </select>
                </div>
                <div className="min-w-0">
                  <select
                    value={siteFilter}
                    onChange={(e) => setSiteFilter(e.target.value as SiteFilter)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="همه">همه سایت‌ها</option>
                    <option value="bilitmall">{OWNERSHIP_LABELS.bilitmall}</option>
                    <option value="honarticket">{EXTERNAL_SITE_LABELS.honarticket}</option>
                    <option value="tiwall">{EXTERNAL_SITE_LABELS.tiwall}</option>
                    <option value="other">{EXTERNAL_SITE_LABELS.other}</option>
                  </select>
                </div>
              </div>
              {dateFilter ? (
                <button
                  type="button"
                  onClick={() => setDateFilter(null)}
                  className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  حذف فیلتر تاریخ
                </button>
              ) : null}
            </div>

            {!loading && !error ? (
              <EventAdminStatsPanel
                events={events}
                filteredCount={filteredEvents.length}
              />
            ) : null}

            {selectedCount > 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-500/30 dark:bg-red-500/10">
                <p className="text-sm font-bold text-red-800 dark:text-red-200">
                  {selectedCount.toLocaleString("fa-IR")} رویداد انتخاب شده
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={clearSelection}
                    disabled={bulkDeleting}
                    className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50 dark:border-red-500/30 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-500/15"
                  >
                    لغو انتخاب
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkDelete}
                    disabled={bulkDeleting}
                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
                  >
                    {bulkDeleting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        در حال حذف...
                      </>
                    ) : (
                      `حذف کامل ${selectedCount.toLocaleString("fa-IR")} رویداد`
                    )}
                  </button>
                </div>
              </div>
            ) : null}

            <div className={adminTableClasses.panel}>
              {loading ? (
                <p className={adminTableClasses.emptyInPanel}>در حال بارگذاری...</p>
              ) : error ? (
                <p className={`${adminTableClasses.emptyInPanel} text-red-500 dark:text-red-400`}>{error}</p>
              ) : filteredEvents.length === 0 ? (
                <p className={adminTableClasses.emptyInPanel}>رویدادی یافت نشد.</p>
              ) : (
                <div className={adminTableClasses.panelInner}>
                  <table className={adminTableClasses.table}>
                    <thead className={adminTableClasses.thead}>
                      <tr>
                        <th className={cn(adminTableClasses.th, "w-10 px-2")}>
                          <input
                            ref={selectAllRef}
                            type="checkbox"
                            checked={allFilteredSelected}
                            onChange={toggleSelectAllFiltered}
                            aria-label="انتخاب همه رویدادهای فیلترشده"
                            className="h-4 w-4 accent-blue-600"
                          />
                        </th>
                        <th className={adminTableClasses.th}>رویداد</th>
                        <th className={adminTableClasses.th}>شهر</th>
                        <th className={adminTableClasses.th}>دسته</th>
                        <th className={adminTableClasses.th}>تاریخ</th>
                        <th className={adminTableClasses.th}>محبوب</th>
                        <th className={adminTableClasses.th}>ویژه</th>
                        <th className={adminTableClasses.th}>وضعیت</th>
                        <th className={adminTableClasses.th}>عملیات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEvents.map((event) => {
                        const schedule = getUpcomingEventSchedule(event);
                        const sessionCount = schedule.reduce(
                          (count, day) => count + day.sessions.length,
                          0
                        );

                        const isSelected = selectedIds.has(event.id);

                        return (
                          <tr
                            key={event.id}
                            className={cn(
                              adminTableClasses.tr,
                              isSelected &&
                                "ring-2 ring-blue-400/70 dark:ring-blue-500/50"
                            )}
                          >
                            <td className={cn(adminTableClasses.td, "w-10 px-2")}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleEventSelection(event.id)}
                                aria-label={`انتخاب ${event.title}`}
                                className="h-4 w-4 accent-blue-600"
                              />
                            </td>
                            <td className={cn(adminTableClasses.td, adminTableClasses.tdAccent)}>
                              <div className="flex items-center gap-3">
                                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                                  <EventFramedImage image={event.image} />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-800 dark:text-slate-100">{event.title}</div>
                                  <div className="mt-1">
                                    <EventOriginBadge event={event} />
                                  </div>
                                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    {event.place} • {sessionCount} سانس
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className={adminTableClasses.td}>{event.city}</td>
                            <td className={adminTableClasses.td}>{event.category}</td>
                            <td className={adminTableClasses.tdTop}>
                              <EventScheduleCell event={event} />
                            </td>
                            <td className={adminTableClasses.td}>
                              {event.popular ? (
                                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                                  محبوب
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                              )}
                            </td>
                            <td className={adminTableClasses.td}>
                              {event.featured ? (
                                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700 dark:bg-red-500/20 dark:text-red-300">
                                  ویژه
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                              )}
                            </td>
                            <td className={adminTableClasses.td}>
                              <EventStatusBadge event={event} />
                            </td>
                            <td className={adminTableClasses.td}>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => openEdit(event)}
                                  className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                                >
                                  ویرایش
                                </button>
                                <Link
                                  href={getEventUrl(event)}
                                  className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 dark:bg-blue-500/15 dark:text-blue-300 dark:hover:bg-blue-500/25"
                                >
                                  مشاهده
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(event)}
                                  className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 dark:bg-red-500/15 dark:text-red-300 dark:hover:bg-red-500/25"
                                >
                                  حذف کامل
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-6 text-2xl font-bold text-slate-800 dark:text-slate-100">
              {view === "create" ? "تعریف رویداد جدید" : "ویرایش رویداد"}
            </h2>
            <EventForm
              initialEvent={selectedEvent}
              initialImportUrl={initialImportUrl}
              onSubmit={handleSubmit}
              onCancel={backToList}
              submitting={submitting}
            />
          </div>
        )}
      </div>
    </main>
  );
}

export default function AdminEventsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 p-4 text-slate-900 md:p-8 dark:bg-slate-950 dark:text-slate-100">
          <p className="text-center text-slate-500 dark:text-slate-400">در حال بارگذاری...</p>
        </main>
      }
    >
      <AdminEventsPageContent />
    </Suspense>
  );
}
