"use client";

import { useMemo, useState } from "react";
import { BarChart3, ChevronDown } from "lucide-react";
import { EVENT_CATEGORIES, type EventItem } from "@/lib/events/types";
import { cn } from "@/lib/utils";

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
  const [open, setOpen] = useState(false);

  const stats = useMemo(() => {
    const cityMap = new Map<string, CityEventStats>();
    const categoryTotals = {
      کنسرت: 0,
      تئاتر: 0,
      ایونت: 0,
    } satisfies Record<(typeof EVENT_CATEGORIES)[number], number>;

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
        const category = event.category as (typeof EVENT_CATEGORIES)[number];
        existing.byCategory[category] += 1;
        categoryTotals[category] += 1;
      }

      cityMap.set(event.city, existing);
    }

    const cities = [...cityMap.values()].sort((a, b) => b.total - a.total);

    return {
      total: events.length,
      cities,
      categoryTotals,
    };
  }, [events]);

  if (stats.total === 0) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-slate-500 dark:text-slate-400">
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
          {filteredCount != null && filteredCount !== stats.total ? (
            <p className="mt-1 text-xs font-bold text-blue-600 dark:text-blue-400">
              {filteredCount.toLocaleString("fa-IR")} نتیجه با فیلتر فعلی
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-blue-500/40 dark:hover:bg-blue-500/10 dark:hover:text-blue-300"
        >
          <BarChart3 className="h-4 w-4 shrink-0" />
          {open ? "بستن آمار رویدادها" : "نمایش آمار رویدادها"}
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")}
          />
        </button>
      </div>

      {open ? (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-black text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400">
                <th className="px-3 py-2.5 text-right">شهر</th>
                <th className="px-3 py-2.5 text-right">کل</th>
                {EVENT_CATEGORIES.map((category) => (
                  <th key={category} className="px-3 py-2.5 text-right">
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
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-800/40">
                <td className="px-3 py-3 font-black text-slate-800 dark:text-slate-100">
                  جمع کل
                </td>
                <td className="px-3 py-3 font-black text-blue-700 dark:text-blue-300">
                  {stats.total.toLocaleString("fa-IR")}
                </td>
                {EVENT_CATEGORIES.map((category) => (
                  <td
                    key={category}
                    className="px-3 py-3 font-black text-slate-800 dark:text-slate-100"
                  >
                    {stats.categoryTotals[category].toLocaleString("fa-IR")}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      ) : null}
    </div>
  );
}
