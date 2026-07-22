"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock } from "lucide-react";
import { normalizeTimeString, toLatinDigits } from "@/lib/events/date-utils";
import { cn } from "@/lib/utils";

const QUICK_TIMES = [
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
] as const;

type SessionTimePickerProps = {
  value: string;
  onChange: (time: string) => void;
  className?: string;
};

function parseTime(value: string) {
  const normalized = normalizeTimeString(value);
  const match = normalized.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return { hour: "20", minute: "00" };
  }

  return {
    hour: match[1].padStart(2, "0"),
    minute: match[2].padStart(2, "0"),
  };
}

function sanitizeDigits(raw: string, maxLength: number) {
  return toLatinDigits(raw).replace(/\D/g, "").slice(0, maxLength);
}

function clampPart(raw: string, max: number): string | null {
  if (raw === "") return null;
  const num = Number(raw);
  if (!Number.isFinite(num) || num < 0 || num > max) return null;
  return String(num).padStart(2, "0");
}

export default function SessionTimePicker({ value, onChange, className }: SessionTimePickerProps) {
  const parsed = useMemo(() => parseTime(value), [value]);
  const [hourText, setHourText] = useState(parsed.hour);
  const [minuteText, setMinuteText] = useState(parsed.minute);

  useEffect(() => {
    setHourText(parsed.hour);
    setMinuteText(parsed.minute);
  }, [parsed.hour, parsed.minute]);

  const displayTime = normalizeTimeString(`${parsed.hour}:${parsed.minute}`);

  function commit(nextHourRaw: string, nextMinuteRaw: string) {
    const hour = clampPart(nextHourRaw, 23);
    const minute = clampPart(nextMinuteRaw, 59);

    if (!hour || !minute) {
      setHourText(parsed.hour);
      setMinuteText(parsed.minute);
      return;
    }

    setHourText(hour);
    setMinuteText(minute);
    onChange(normalizeTimeString(`${hour}:${minute}`));
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 text-xs font-bold text-neutral-500 dark:text-slate-400">
        <Clock className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
        <span>
          ساعت انتخابی:{" "}
          <span className="font-black tabular-nums text-neutral-800 dark:text-white" dir="ltr">
            {displayTime}
          </span>
        </span>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900">
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <label className="mb-1.5 block text-center text-sm font-black text-neutral-700 dark:text-slate-200">
              دقیقه
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={2}
              dir="ltr"
              value={minuteText}
              placeholder="00"
              aria-label="دقیقه"
              onChange={(e) => setMinuteText(sanitizeDigits(e.target.value, 2))}
              onBlur={() => commit(hourText, minuteText)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commit(hourText, minuteText);
                }
              }}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-3 text-center text-lg font-black tabular-nums text-neutral-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="flex h-12 items-center pb-0.5 text-xl font-black text-neutral-300">:</div>

          <div className="min-w-0 flex-1">
            <label className="mb-1.5 block text-center text-sm font-black text-neutral-700 dark:text-slate-200">
              ساعت
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={2}
              dir="ltr"
              value={hourText}
              placeholder="18"
              aria-label="ساعت"
              onChange={(e) => setHourText(sanitizeDigits(e.target.value, 2))}
              onBlur={() => commit(hourText, minuteText)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commit(hourText, minuteText);
                }
              }}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-3 text-center text-lg font-black tabular-nums text-neutral-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        <p className="mt-3 text-center text-[11px] font-bold leading-5 text-neutral-500 dark:text-slate-400">
          ساعت را به‌صورت <span className="text-brand-600 dark:text-brand-400">۲۴ ساعته</span> وارد
          کنید؛ مثلاً برای ۶ عصر بنویسید{" "}
          <span className="font-black tabular-nums text-neutral-800 dark:text-white" dir="ltr">
            18
          </span>{" "}
          نه 6pm.
        </p>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-2 py-2 dark:border-white/10 dark:bg-slate-800/60">
        <p className="mb-1.5 text-[10px] font-bold text-neutral-500 dark:text-slate-400">
          پیشنهادهای سریع (پیش‌فرض):
        </p>
        <div className="flex flex-wrap justify-center gap-1" dir="ltr">
          {QUICK_TIMES.map((time) => {
            const active = displayTime === time;
            return (
              <button
                key={time}
                type="button"
                onClick={() => onChange(time)}
                className={cn(
                  "rounded-md px-2 py-1 text-[10px] font-bold tabular-nums transition active:scale-[0.98]",
                  active
                    ? "bg-brand-600 text-white"
                    : "bg-white text-neutral-600 hover:bg-neutral-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-700"
                )}
              >
                {time}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
