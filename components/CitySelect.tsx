"use client";

import { useCities } from "@/components/CitiesProvider";

type CitySelectProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  includeAll?: boolean;
  allLabel?: string;
  disabled?: boolean;
  id?: string;
};

export default function CitySelect({
  value,
  onChange,
  className = "w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-blue-500",
  includeAll = false,
  allLabel = "همه شهرها",
  disabled,
  id,
}: CitySelectProps) {
  const { cities, loading } = useCities();

  return (
    <select
      id={id}
      value={value}
      disabled={disabled || loading}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    >
      {includeAll ? <option value="همه">{allLabel}</option> : null}
      {cities.map((city) => (
        <option key={city} value={city}>
          {city}
        </option>
      ))}
    </select>
  );
}
