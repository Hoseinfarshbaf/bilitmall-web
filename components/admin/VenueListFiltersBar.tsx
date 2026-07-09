"use client";

import CitySelect from "@/components/CitySelect";
type VenueListFiltersBarProps = {
  search: string;
  city: string;
  source?: string;
  organizer?: string;
  showSourceFilter?: boolean;
  showOrganizerFilter?: boolean;
  onSearchChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onSourceChange?: (value: string) => void;
  onOrganizerChange?: (value: string) => void;
};

export default function VenueListFiltersBar({
  search,
  city,
  source = "همه",
  organizer = "",
  showSourceFilter,
  showOrganizerFilter,
  onSearchChange,
  onCityChange,
  onSourceChange,
  onOrganizerChange,
}: VenueListFiltersBarProps) {
  return (
    <div className="mt-6 flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="min-w-[200px] flex-1">
        <label className="mb-1 block text-xs font-bold text-slate-500 dark:text-slate-400">جستجو</label>
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="نام سالن، آدرس، رویداد..."
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </div>
      <div className="w-36">
        <label className="mb-1 block text-xs font-bold text-slate-500 dark:text-slate-400">شهر</label>
        <CitySelect
          includeAllCities
          value={city}
          includeAll
          onChange={onCityChange}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </div>
      {showSourceFilter ? (
        <div className="w-40">
          <label className="mb-1 block text-xs font-bold text-slate-500 dark:text-slate-400">منبع</label>
          <select
            value={source}
            onChange={(e) => onSourceChange?.(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="همه">همه</option>
            <option value="admin">مدیر</option>
            <option value="organizer">برگزارکننده</option>
          </select>
        </div>
      ) : null}
      {showOrganizerFilter ? (
        <div className="min-w-[160px] flex-1">
          <label className="mb-1 block text-xs font-bold text-slate-500 dark:text-slate-400">برگزارکننده</label>
          <input
            value={organizer}
            onChange={(e) => onOrganizerChange?.(e.target.value)}
            placeholder="نام یا شناسه برگزارکننده"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
      ) : null}
    </div>
  );
}
