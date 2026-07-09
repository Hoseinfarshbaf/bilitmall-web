"use client";

import { useMemo } from "react";
import { EVENT_CATEGORIES, type EventItem } from "@/lib/events/types";

type CityEventStats = {
  city: string;
  total: number;
  byCategory: Record<(typeof EVENT_CATEGORIES)[number], number>;
};

type EventAdminStatsPanelProps = {
  events: EventItem[];
  filteredCount?: number;
};

export default function EventAdminStatsPanel({
  events,
  filteredCount,
}: EventAdminStatsPanelProps) {
  const stats = useMemo(() => {
    const cityMap = new Map<string, CityEventStats>();

    for (const event of events) {
      const existing = cityMap.get(event.city) ?? {
        city: event.city,
        total: 0,
        byCategory: {
          کنسرت: 0,
          تئاتر: 0,
          ایونت: 0,
        },
      };

      existing.total += 1;
      if (event.category in existing.byCategory) {
        existing.byCategory[event.category as (typeof EVENT_CATEGORIES)[number]] += 1;
      }

      cityMap.set(event.city, existing);
    }

    const cities = [...cityMap.values()].sort((a, b) => b.total - a.total);

    return {
      total: events.length,
      cities,
    };
  }, [events]);

  if (stats.total === 0) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">آمار رویدادها</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            مجموع{" "}
            <span className="font-black text-slate-800 dark:text-slate-100">
              {stats.total.toLocaleString("fa-IR")}
            </span>{" "}
            رویداد در{" "}
            <span className="font-black text-slate-800 dark:text-slate-100">
              {stats.cities.length.toLocaleString("fa-IR")}
            </span>{" "}
            شهر
          </p>
        </div>
        {filteredCount != null && filteredCount !== stats.total ? (
          <p className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
            {filteredCount.toLocaleString("fa-IR")} نتیجه با فیلتر فعلی
          </p>
        ) : null}
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] font-black text-slate-500 dark:border-slate-700 dark:text-slate-400">
              <th className="px-3 py-2 text-right">شهر</th>
              <th className="px-3 py-2 text-right">کل</th>
              {EVENT_CATEGORIES.map((category) => (
                <th key={category} className="px-3 py-2 text-right">
                  {category}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stats.cities.map((row) => (
              <tr
                key={row.city}
                className="border-b border-slate-100 last:border-0 dark:border-slate-800"
              >
                <td className="px-3 py-2.5 font-bold text-slate-800 dark:text-slate-100">
                  {row.city}
                </td>
                <td className="px-3 py-2.5 font-black text-slate-700 dark:text-slate-200">
                  {row.total.toLocaleString("fa-IR")}
                </td>
                {EVENT_CATEGORIES.map((category) => (
                  <td
                    key={category}
                    className="px-3 py-2.5 text-slate-600 dark:text-slate-300"
                  >
                    {row.byCategory[category].toLocaleString("fa-IR")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
