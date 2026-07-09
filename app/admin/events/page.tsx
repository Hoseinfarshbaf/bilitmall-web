"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
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
import { getEventImageStyle, getEventUrl } from "@/lib/events/helpers";
import { cn } from "@/lib/utils";

type ViewMode = "list" | "create" | "edit";
type HighlightFilter = "همه" | "popular" | "featured" | "both";

function AdminEventsPageContent() {
  const searchParams = useSearchParams();
  const { events, loading, error, refetch } = useAdminEvents();
  const [view, setView] = useState<ViewMode>("list");
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("همه");
  const [categoryFilter, setCategoryFilter] = useState("همه");
  const [statusFilter, setStatusFilter] = useState("همه");
  const [dateFilter, setDateFilter] = useState<DateObject | null>(null);
  const [highlightFilter, setHighlightFilter] = useState<HighlightFilter>("همه");

  const initialImportUrl = searchParams.get("importUrl") ?? "";

  useEffect(() => {
    if (searchParams.get("create") === "1") {
      setSelectedEvent(null);
      setView("create");
    }
  }, [searchParams]);

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

      return (
        matchSearch &&
        matchCity &&
        matchCategory &&
        matchStatus &&
        matchDate &&
        matchHighlight
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
  ]);

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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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

                        return (
                          <tr key={event.id} className={adminTableClasses.tr}>
                            <td className={cn(adminTableClasses.td, adminTableClasses.tdAccent)}>
                              <div className="flex items-center gap-3">
                                <div
                                  className="h-12 w-12 shrink-0 rounded-xl"
                                  style={getEventImageStyle(event.image)}
                                />
                                <div>
                                  <div className="font-bold text-slate-800 dark:text-slate-100">{event.title}</div>
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
