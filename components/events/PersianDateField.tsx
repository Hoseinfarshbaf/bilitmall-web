"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Calendar, DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

type PersianDateFieldProps = {
  label: string;
  value: DateObject | null;
  onChange: (date: DateObject | null) => void;
  placeholder?: string;
  hasError?: boolean;
  className?: string;
  /** وقتی false شود، تقویم فوراً بسته می‌شود (قبل از تغییر مرحله ویزارد) */
  enabled?: boolean;
};

/**
 * تقویم شمسی بدون portal / DOM شناور خارج از درخت React.
 * تقویم فقط به‌صورت inline زیر فیلد باز می‌شود تا removeChild رخ ندهد.
 */
export default function PersianDateField({
  label,
  value,
  onChange,
  placeholder = "انتخاب تاریخ",
  hasError = false,
  className,
  enabled = true,
}: PersianDateFieldProps) {
  const fieldId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!enabled && open) setOpen(false);
  }, [enabled, open]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node | null;
      if (!target || !rootRef.current?.contains(target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const displayValue = value
    ? new DateObject(value).setLocale(persian_fa).format("D MMMM YYYY")
    : "";

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <label
        htmlFor={fieldId}
        className="mb-2 block text-sm font-bold text-neutral-700 dark:text-slate-300"
      >
        {label}
      </label>
      <button
        id={fieldId}
        type="button"
        disabled={!enabled}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-xl border bg-neutral-50 px-3 py-3 text-right text-sm font-bold outline-none transition focus:border-emerald-500 dark:bg-slate-900",
          hasError
            ? "border-red-400 dark:border-red-500/60"
            : "border-neutral-200 dark:border-white/10",
          open && "border-emerald-500 ring-2 ring-emerald-500/20"
        )}
      >
        <span
          className={cn(
            "min-w-0 flex-1 truncate",
            displayValue
              ? "text-neutral-900 dark:text-white"
              : "text-neutral-400 dark:text-slate-500"
          )}
        >
          {displayValue || placeholder}
        </span>
        <CalendarDays className="h-4 w-4 shrink-0 text-neutral-400" />
      </button>

      {open && enabled ? (
        <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-2xl border border-neutral-200 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-slate-900 [&_.rmdp-wrapper]:!shadow-none">
          <Calendar
            value={value}
            onChange={(date) => {
              onChange((date as DateObject) ?? null);
              setOpen(false);
            }}
            calendar={persian}
            locale={persian_fa}
            numberOfMonths={1}
            className="rmdp-prime"
          />
        </div>
      ) : null}
    </div>
  );
}
