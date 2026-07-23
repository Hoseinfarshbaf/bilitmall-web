"use client";

import { useState } from "react";
import { LayoutGrid, Sparkles, X } from "lucide-react";

type CanvasSetupWizardProps = {
  initialRows?: number;
  initialCols?: number;
  onConfirm: (rows: number, seatsPerRow: number) => void;
  onSkip?: () => void;
};

export default function CanvasSetupWizard({
  initialRows = 8,
  initialCols = 12,
  onConfirm,
  onSkip,
}: CanvasSetupWizardProps) {
  const [rows, setRows] = useState(initialRows);
  const [cols, setCols] = useState(initialCols);

  return (
    <div className="fixed inset-0 z-110 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
      <div
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
        dir="rtl"
        role="dialog"
        aria-labelledby="canvas-setup-title"
      >
        <div className="mb-1 flex items-start justify-between gap-3">
          <div>
            <p
              id="canvas-setup-title"
              className="text-lg font-black text-neutral-900"
            >
              شروع طراحی سالن
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              اول بگویید چند ردیف و در هر ردیف چند صندلی می‌خواهید. بعد می‌توانید
              هر ردیف را جداگانه جابه‌جا و ویرایش کنید.
            </p>
          </div>
          {onSkip ? (
            <button
              type="button"
              onClick={onSkip}
              className="rounded-xl border border-neutral-200 p-2 text-neutral-500 hover:bg-neutral-50"
              aria-label="بستن"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <label className="text-xs font-bold text-neutral-500">
            تعداد ردیف
            <input
              type="number"
              min={1}
              max={40}
              value={rows}
              onChange={(e) => setRows(Number(e.target.value) || 1)}
              className="mt-1.5 w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-base font-black outline-none focus:border-brand-500"
              dir="ltr"
            />
          </label>
          <label className="text-xs font-bold text-neutral-500">
            صندلی در هر ردیف
            <input
              type="number"
              min={1}
              max={50}
              value={cols}
              onChange={(e) => setCols(Number(e.target.value) || 1)}
              className="mt-1.5 w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-base font-black outline-none focus:border-brand-500"
              dir="ltr"
            />
          </label>
        </div>

        <p className="mt-3 rounded-xl bg-neutral-50 px-3 py-2 text-center text-xs font-bold text-neutral-600">
          جمع:{" "}
          {(Math.max(1, rows) * Math.max(1, cols)).toLocaleString("fa-IR")} صندلی
        </p>

        <button
          type="button"
          onClick={() =>
            onConfirm(Math.min(40, Math.max(1, rows)), Math.min(50, Math.max(1, cols)))
          }
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-500 py-3 text-sm font-black text-white hover:bg-brand-600"
        >
          <Sparkles className="h-4 w-4" />
          ساخت سالن و ادامه
        </button>

        {onSkip ? (
          <button
            type="button"
            onClick={onSkip}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-neutral-200 py-2.5 text-xs font-bold text-neutral-500 hover:bg-neutral-50"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            رد کردن — بوم خالی
          </button>
        ) : null}
      </div>
    </div>
  );
}
