"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { EventDay, EventItem } from "@/lib/events/types";
import {
  formatDaysUntilLabel,
  formatPersianDateShort,
  getDaysUntilDate,
  getUpcomingEventSchedule,
} from "@/lib/events/date-utils";

const PREVIEW_DAYS = 2;

function daysUntilBadgeClass(daysUntil: number): string {
  if (daysUntil === 0) {
    return "bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300";
  }
  if (daysUntil <= 3) {
    return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300";
  }
  return "bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300";
}

function ScheduleDayRow({ day }: { day: EventDay }) {
  const daysUntil = getDaysUntilDate(day.date);

  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-800/60">
      <div className="flex items-center justify-between gap-1.5">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-bold text-slate-800 dark:text-slate-100">
            {formatPersianDateShort(day.date)}
          </p>
          <p className="text-[9px] text-slate-400" dir="ltr">
            {day.date}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${daysUntilBadgeClass(daysUntil)}`}
        >
          {formatDaysUntilLabel(day.date)}
        </span>
      </div>
      <div className="mt-1 flex flex-wrap gap-1">
        {day.sessions.map((session, index) => (
          <span
            key={`${day.date}-${session.time}-${index}`}
            className={`rounded px-1.5 py-0.5 text-[10px] font-medium ring-1 ${
              session.purchaseUrl
                ? "bg-green-50 text-green-700 ring-green-200 dark:bg-green-500/15 dark:text-green-300 dark:ring-green-500/30"
                : "bg-white text-slate-600 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700"
            }`}
            title={session.purchaseUrl ? "لینک خرید ثبت شده" : "بدون لینک خرید"}
          >
            {session.time}
            {session.purchaseUrl ? " 🔗" : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

type EventScheduleCellProps = {
  event: EventItem;
};

export default function EventScheduleCell({ event }: EventScheduleCellProps) {
  const [expanded, setExpanded] = useState(false);
  const schedule = getUpcomingEventSchedule(event);

  if (schedule.length === 0) {
    return <span className="text-xs text-slate-400 dark:text-slate-500">—</span>;
  }

  const totalSessions = schedule.reduce((count, day) => count + day.sessions.length, 0);
  const needsCollapse = schedule.length > PREVIEW_DAYS;
  const visibleDays =
    expanded || !needsCollapse ? schedule : schedule.slice(0, PREVIEW_DAYS);
  const hiddenCount = schedule.length - PREVIEW_DAYS;
  const firstDay = schedule[0];
  const lastDay = schedule[schedule.length - 1];

  return (
    <div className="min-w-[175px] max-w-[220px]">
      <div className="mb-1.5 space-y-0.5">
        <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
          {schedule.length.toLocaleString("fa-IR")} روز ·{" "}
          {totalSessions.toLocaleString("fa-IR")} سانس
        </p>
        {schedule.length > 1 ? (
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            {formatPersianDateShort(firstDay.date)} تا {formatPersianDateShort(lastDay.date)}
          </p>
        ) : null}
        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
          نزدیک‌ترین: {formatDaysUntilLabel(firstDay.date)}
          {firstDay.sessions[0]?.time ? ` · ${firstDay.sessions[0].time}` : ""}
        </p>
      </div>

      <div
        className={`space-y-1 ${expanded && needsCollapse ? "max-h-40 overflow-y-auto rounded-lg pr-0.5" : ""}`}
      >
        {visibleDays.map((day) => (
          <ScheduleDayRow key={day.date} day={day} />
        ))}
      </div>

      {needsCollapse ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-1.5 flex w-full items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-500/40 dark:hover:bg-blue-500/10 dark:hover:text-blue-300"
        >
          {expanded
            ? "جمع کردن برنامه"
            : `مشاهده ${hiddenCount.toLocaleString("fa-IR")} روز دیگر`}
          <ChevronDown
            className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      ) : null}
    </div>
  );
}
