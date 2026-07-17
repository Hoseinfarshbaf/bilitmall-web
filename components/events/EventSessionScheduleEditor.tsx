"use client";

import { useEffect, useMemo, useState } from "react";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { CalendarRange, Clock3, Copy, Plus, Trash2 } from "lucide-react";
import type { EventDay } from "@/lib/events/types";
import { normalizeDateString, normalizeTimeString } from "@/lib/events/date-utils";
import { cn } from "@/lib/utils";
import SessionTimePicker from "@/components/events/SessionTimePicker";

const SESSION_STEP_LABELS = ["۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹", "۱۰"] as const;

const SESSION_TONES = [
  {
    card: "border-emerald-200 bg-emerald-50/70 dark:border-emerald-500/25 dark:bg-emerald-500/10",
    badge: "bg-emerald-600 text-white",
    bar: "bg-emerald-500",
  },
  {
    card: "border-sky-200 bg-sky-50/70 dark:border-sky-500/25 dark:bg-sky-500/10",
    badge: "bg-sky-600 text-white",
    bar: "bg-sky-500",
  },
  {
    card: "border-violet-200 bg-violet-50/70 dark:border-violet-500/25 dark:bg-violet-500/10",
    badge: "bg-violet-600 text-white",
    bar: "bg-violet-500",
  },
  {
    card: "border-amber-200 bg-amber-50/70 dark:border-amber-500/25 dark:bg-amber-500/10",
    badge: "bg-amber-600 text-white",
    bar: "bg-amber-500",
  },
] as const;

type EventSessionScheduleEditorProps = {
  days: EventDay[];
  onAddSession: (dayIndex: number) => void;
  onRemoveSession: (dayIndex: number, sessionIndex: number) => void;
  onRemoveDay: (dayIndex: number) => void;
  onUpdateSessionTime: (dayIndex: number, sessionIndex: number, time: string) => void;
  onApplySessionsToAllDays?: (sourceDayIndex: number) => void;
};

function getDayMeta(date: string) {
  const normalized = normalizeDateString(date);
  const dateObject = new DateObject({
    date: normalized,
    format: "YYYY/MM/DD",
    calendar: persian,
    locale: persian_fa,
  });

  return {
    weekday: dateObject.weekDay.name,
    dayNumber: dateObject.format("D"),
    month: dateObject.format("MMMM"),
    year: dateObject.format("YYYY"),
    fullLabel: dateObject.format("D MMMM YYYY"),
  };
}

export default function EventSessionScheduleEditor({
  days,
  onAddSession,
  onRemoveSession,
  onRemoveDay,
  onUpdateSessionTime,
  onApplySessionsToAllDays,
}: EventSessionScheduleEditorProps) {
  const daySignature = days.map((day) => day.date).join("|");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const totalSessions = useMemo(
    () => days.reduce((count, day) => count + day.sessions.length, 0),
    [days]
  );

  useEffect(() => {
    setSelectedIndex((current) => Math.min(current, Math.max(0, days.length - 1)));
  }, [daySignature, days.length]);

  if (days.length === 0) {
    return (
      <div className="flex min-h-32 flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-8 text-center dark:border-white/10 dark:bg-slate-900/40">
        <CalendarRange className="mb-3 h-8 w-8 text-neutral-300 dark:text-slate-600" />
        <p className="text-sm font-bold text-neutral-600 dark:text-slate-300">
          بازه تاریخ را انتخاب کنید
        </p>
        <p className="mt-1 text-xs text-neutral-400 dark:text-slate-500">
          پس از انتخاب «از تاریخ» و «تا تاریخ»، روزها اینجا نمایش داده می‌شوند.
        </p>
      </div>
    );
  }

  const safeIndex = Math.min(selectedIndex, days.length - 1);
  const selectedDay = days[safeIndex];
  const selectedMeta = getDayMeta(selectedDay.date);

  return (
    <div className="space-y-4">
      <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
        <CalendarRange className="h-3.5 w-3.5" />
        {days.length.toLocaleString("fa-IR")} روز · {totalSessions.toLocaleString("fa-IR")} سانس
      </div>

      <div className="flex flex-wrap gap-2">
        {days.map((day, dayIndex) => {
          const meta = getDayMeta(day.date);
          const active = dayIndex === safeIndex;

          return (
            <button
              key={day.date}
              type="button"
              onClick={() => setSelectedIndex(dayIndex)}
              className={cn(
                "flex min-w-18 flex-col items-center rounded-2xl border px-3 py-2.5 transition active:scale-[0.98]",
                active
                  ? "border-emerald-500 bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "border-neutral-200 bg-white text-neutral-700 hover:border-emerald-300 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
              )}
            >
              <span className={cn("text-[10px] font-bold", active ? "text-emerald-100" : "text-neutral-400")}>
                {meta.weekday}
              </span>
              <span className="text-lg font-black leading-none">{meta.dayNumber}</span>
              <span className={cn("mt-0.5 text-[10px] font-medium", active ? "text-emerald-100" : "text-neutral-400")}>
                {meta.month}
              </span>
              <span className={cn("text-[10px]", active ? "text-emerald-100/80" : "text-neutral-400")}>
                {meta.year}
              </span>
              {day.sessions.length > 1 ? (
                <span
                  className={cn(
                    "mt-1.5 rounded-full px-2 py-0.5 text-[10px] font-black leading-none",
                    active ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                  )}
                >
                  {day.sessions.length.toLocaleString("fa-IR")} سانس
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="overflow-visible rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 bg-neutral-50 px-4 py-3.5 dark:border-white/10 dark:bg-slate-800/50">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <p className="text-lg font-black text-neutral-900 dark:text-white">
                {selectedMeta.fullLabel}
              </p>
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                {selectedMeta.weekday}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-neutral-400 dark:text-slate-500">
              سال {selectedMeta.year}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              onRemoveDay(safeIndex);
              setSelectedIndex((current) => Math.max(0, current - 1));
            }}
            className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 dark:border-red-500/30 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            حذف این روز
          </button>
        </div>

        <div className="space-y-4 overflow-visible p-4">
          {days.length > 1 && onApplySessionsToAllDays ? (
            <button
              type="button"
              onClick={() => onApplySessionsToAllDays(safeIndex)}
              className="group flex w-full items-center gap-3 rounded-2xl border border-emerald-500/25 bg-linear-to-l from-emerald-500/10 to-transparent px-4 py-3 text-right transition hover:border-emerald-500/50 hover:from-emerald-500/15 dark:border-emerald-400/20 dark:from-emerald-500/10"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/25 transition group-hover:scale-105">
                <Copy className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-black text-emerald-800 dark:text-emerald-200">
                  اعمال سانس‌های این روز به همه
                </span>
                <span className="mt-0.5 block text-[11px] font-medium text-emerald-700/70 dark:text-emerald-300/70">
                  همین ساعت‌ها برای بقیه روزها هم کپی می‌شود
                </span>
              </span>
            </button>
          ) : null}

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <p className="shrink-0 text-xs font-black text-neutral-600 dark:text-slate-300">
                سانس‌های این روز
              </p>
              <div className="h-px min-w-4 flex-1 bg-neutral-200 dark:bg-white/10" />
              <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-bold text-neutral-500 dark:bg-white/10 dark:text-slate-400">
                {selectedDay.sessions.length.toLocaleString("fa-IR")} سانس
              </span>
            </div>

            {selectedDay.sessions.map((session, sessionIndex) => {
              const tone = SESSION_TONES[sessionIndex % SESSION_TONES.length];
              const stepLabel =
                SESSION_STEP_LABELS[sessionIndex] ?? String(sessionIndex + 1).padStart(2, "0");
              const timeLabel = normalizeTimeString(session.time);

              return (
                <div
                  key={`${selectedDay.date}-${sessionIndex}`}
                  className={cn(
                    "overflow-visible rounded-2xl border p-3.5 shadow-sm",
                    tone.card
                  )}
                >
                  <div className="flex gap-3">
                    <span
                      aria-hidden
                      className={cn("mt-1 mb-1 w-1 shrink-0 self-stretch rounded-full", tone.bar)}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black leading-none",
                              tone.badge
                            )}
                          >
                            {stepLabel}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-black text-neutral-900 dark:text-white">
                              سانس {stepLabel}
                            </p>
                            <p className="mt-0.5 flex items-center gap-1 text-[11px] font-bold text-neutral-500 dark:text-slate-400">
                              <Clock3 className="h-3 w-3 shrink-0" />
                              <span className="tabular-nums" dir="ltr">
                                {timeLabel}
                              </span>
                            </p>
                          </div>
                        </div>

                        {selectedDay.sessions.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => onRemoveSession(safeIndex, sessionIndex)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-red-500 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            حذف
                          </button>
                        ) : null}
                      </div>

                      <div className="my-3.5 h-px w-full bg-neutral-200/90 dark:bg-white/10" />

                      <div className="rounded-xl border border-white/80 bg-white/90 p-3 dark:border-white/10 dark:bg-slate-950/40">
                        <SessionTimePicker
                          value={session.time}
                          onChange={(time) => onUpdateSessionTime(safeIndex, sessionIndex, time)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => onAddSession(safeIndex)}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-emerald-400/50 bg-emerald-500/5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-500/10 dark:text-emerald-300"
          >
            <Plus className="h-4 w-4" />
            افزودن سانس جدید
          </button>
        </div>
      </div>
    </div>
  );
}
