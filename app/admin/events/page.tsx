"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import EventForm from "@/components/admin/EventForm";
import EventStatusBadge from "@/components/admin/EventStatusBadge";
import CitySelect from "@/components/CitySelect";
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
import { eventMatchesDateFilter, getUpcomingEventSchedule } from "@/lib/events/date-utils";
import { getEventImageStyle, getEventUrl } from "@/lib/events/helpers";

type ViewMode = "list" | "create" | "edit";
type HighlightFilter = "همه" | "popular" | "featured" | "both";

function EventScheduleCell({ event }: { event: EventItem }) {
  const schedule = getUpcomingEventSchedule(event);

  if (schedule.length === 0) {
    return <span className="text-xs text-slate-400">—</span>;
  }

  const firstDay = schedule[0];
  const totalSessions = schedule.reduce(
    (count, day) => count + day.sessions.length,
    0
  );
  const moreDays = schedule.length - 1;

  return (
    <div className="min-w-[140px]">
      <div className="text-xs font-bold text-slate-800">{firstDay.date}</div>
      <div className="mt-1 flex flex-wrap gap-1">
        {firstDay.sessions.map((session, index) => (
          <span
            key={`${firstDay.date}-${session.time}-${index}`}
            className={`rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ${
              session.purchaseUrl
                ? "bg-green-50 text-green-700 ring-green-200"
                : "bg-white text-slate-600 ring-slate-200"
            }`}
            title={session.purchaseUrl ? "لینک خرید ثبت شده" : "بدون لینک خرید"}
          >
            {session.time}
            {session.purchaseUrl ? " 🔗" : ""}
          </span>
        ))}
      </div>
      {moreDays > 0 || totalSessions > firstDay.sessions.length ? (
        <p className="mt-1.5 text-[11px] font-medium text-slate-500">
          {moreDays > 0 ? `${moreDays.toLocaleString("fa-IR")} روز دیگر` : null}
          {moreDays > 0 && totalSessions > 1 ? " · " : null}
          {totalSessions > 1
            ? `${totalSessions.toLocaleString("fa-IR")} سانس`
            : null}
        </p>
      ) : null}
    </div>
  );
}

export default function AdminEventsPage() {
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

  const handleSubmit = async (formData: EventFormData, imageFile: File | null) => {
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
      payload.append("price", formData.price);
      payload.append("imageUrl", formData.image);
      payload.append("badge", formData.badge);
      payload.append("days", JSON.stringify(formData.days));
      payload.append("published", String(formData.published));
      payload.append("popular", String(formData.popular));
      payload.append("featured", String(formData.featured));
      payload.append("status", formData.status);

      if (imageFile) {
        payload.append("image", imageFile);
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
    <main className="min-h-screen bg-slate-50 p-4 md:p-8" dir="rtl">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              href="/admin"
              className="mb-2 inline-block text-sm font-bold text-blue-600 hover:text-blue-700"
            >
              ← بازگشت به پنل
            </Link>
            <h1 className="text-3xl font-black text-slate-800">مدیریت رویدادها</h1>
            <p className="mt-1 text-sm text-slate-500">
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
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-6">
                <input
                  type="text"
                  placeholder="جستجو..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
                <div className="rounded-xl border border-slate-200 p-2 focus-within:border-blue-500">
                  <DatePicker
                    value={dateFilter}
                    onChange={(date) => setDateFilter((date as DateObject) ?? null)}
                    calendar={persian}
                    locale={persian_fa}
                    calendarPosition="bottom-right"
                    format="YYYY/MM/DD"
                    inputClass="w-full outline-none p-1.5 text-sm"
                    placeholder="فیلتر تاریخ"
                  />
                </div>
                <CitySelect
                  value={cityFilter}
                  includeAll
                  onChange={setCityFilter}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                >
                  <option value="همه">همه دسته‌ها</option>
                  {EVENT_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <select
                  value={highlightFilter}
                  onChange={(e) =>
                    setHighlightFilter(e.target.value as HighlightFilter)
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                >
                  <option value="همه">همه نمایش‌ها</option>
                  <option value="popular">فقط محبوب</option>
                  <option value="featured">فقط ویژه</option>
                  <option value="both">محبوب و ویژه</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                >
                  <option value="همه">همه وضعیت‌ها</option>
                  <option value="active">{EVENT_STATUS_LABELS.active}</option>
                  <option value="sold_out">{EVENT_STATUS_LABELS.sold_out}</option>
                  <option value="cancelled">{EVENT_STATUS_LABELS.cancelled}</option>
                  <option value="draft">{EVENT_STATUS_LABELS.draft}</option>
                </select>
              </div>
              {dateFilter ? (
                <button
                  type="button"
                  onClick={() => setDateFilter(null)}
                  className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-700"
                >
                  حذف فیلتر تاریخ
                </button>
              ) : null}
            </div>

            <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
              {loading ? (
                <p className="p-8 text-center text-slate-500">در حال بارگذاری...</p>
              ) : error ? (
                <p className="p-8 text-center text-red-500">{error}</p>
              ) : filteredEvents.length === 0 ? (
                <p className="p-8 text-center text-slate-500">رویدادی یافت نشد.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-4 py-3 text-right font-bold">رویداد</th>
                        <th className="px-4 py-3 text-right font-bold">شهر</th>
                        <th className="px-4 py-3 text-right font-bold">دسته</th>
                        <th className="px-4 py-3 text-right font-bold">تاریخ</th>
                        <th className="px-4 py-3 text-right font-bold">محبوب</th>
                        <th className="px-4 py-3 text-right font-bold">ویژه</th>
                        <th className="px-4 py-3 text-right font-bold">وضعیت</th>
                        <th className="px-4 py-3 text-right font-bold">عملیات</th>
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
                          <tr key={event.id} className="border-t border-slate-100">
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className="h-12 w-12 shrink-0 rounded-xl"
                                  style={getEventImageStyle(event.image)}
                                />
                                <div>
                                  <div className="font-bold text-slate-800">{event.title}</div>
                                  <div className="mt-1 text-xs text-slate-500">
                                    {event.place} • {sessionCount} سانس
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">{event.city}</td>
                            <td className="px-4 py-4">{event.category}</td>
                            <td className="px-4 py-4 align-top">
                              <EventScheduleCell event={event} />
                            </td>
                            <td className="px-4 py-4">
                              {event.popular ? (
                                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                                  محبوب
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              {event.featured ? (
                                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                                  ویژه
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <EventStatusBadge event={event} />
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => openEdit(event)}
                                  className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
                                >
                                  ویرایش
                                </button>
                                <Link
                                  href={getEventUrl(event)}
                                  className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100"
                                >
                                  مشاهده
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(event)}
                                  className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100"
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
          <div className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
            <h2 className="mb-6 text-2xl font-bold text-slate-800">
              {view === "create" ? "تعریف رویداد جدید" : "ویرایش رویداد"}
            </h2>
            <EventForm
              initialEvent={selectedEvent}
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
