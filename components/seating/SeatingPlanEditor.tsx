"use client";

import { useMemo, useState } from "react";
import { LayoutGrid, Maximize2 } from "lucide-react";
import SeatingStudio from "@/components/seating/SeatingStudio";
import { countBookableSeats, normalizeLayout } from "@/lib/seating/layout";
import type { SeatingLayout } from "@/lib/seating/types";

type SeatingPlanEditorProps = {
  initialLayout: SeatingLayout;
  templates?: { id: number; name: string; layout: SeatingLayout }[];
  onSave?: (layout: SeatingLayout) => Promise<void>;
  saving?: boolean;
  hideVenueName?: boolean;
  readOnly?: boolean;
  openLabel?: string;
  autoOpen?: boolean;
};

export default function SeatingPlanEditor({
  initialLayout,
  templates = [],
  onSave,
  saving = false,
  hideVenueName = false,
  readOnly = false,
  openLabel,
  autoOpen = false,
}: SeatingPlanEditorProps) {
  const [layout, setLayout] = useState<SeatingLayout>(() => normalizeLayout(initialLayout));
  const [studioOpen, setStudioOpen] = useState(autoOpen);

  const bookableCount = useMemo(() => countBookableSeats(layout), [layout]);
  const zoneCount = layout.zones?.length ?? 0;
  const balconyCount = layout.zones?.filter((z) => z.type === "balcony").length ?? 0;
  const enterLabel =
    openLabel ??
    (readOnly ? "ورود به صحنه" : "ورود به استودیو طراحی");

  async function handleSave() {
    if (readOnly || !onSave) {
      setStudioOpen(false);
      return;
    }
    await onSave(normalizeLayout(layout));
    setStudioOpen(false);
  }

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-linear-to-br from-slate-50 to-slate-100 p-5 dark:border-white/10 dark:from-slate-800/80 dark:to-slate-900/80">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-brand-600 dark:text-brand-400" />
              <p className="text-base font-black text-slate-900 dark:text-white">
                {readOnly ? "مشاهده سالن و صندلی‌ها" : "طراحی سالن و صندلی‌گذاری"}
              </p>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              {readOnly
                ? "نقشه سالن تأییدشده بلیت‌مال را مشاهده کنید. تغییر چیدمان توسط برگزارکننده ممکن نیست."
                : "صحنه یکپارچه، بالکن‌ها، جایگاه‌ها و چیدمان آزاد صندلی‌ها را در استودیوی طراحی تنظیم کنید. قیمت را برای همه، هر ردیف یا هر صندلی جداگانه تعیین کنید."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-brand-100 px-3 py-1 font-bold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                {bookableCount.toLocaleString("fa-IR")} صندلی
              </span>
              <span className="rounded-full bg-violet-100 px-3 py-1 font-bold text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
                {layout.rows} ردیف × {layout.cols} ستون
              </span>
              {zoneCount > 0 ? (
                <span className="rounded-full bg-sky-100 px-3 py-1 font-bold text-sky-700 dark:bg-sky-500/20 dark:text-sky-300">
                  {zoneCount} جایگاه
                  {balconyCount > 0 ? ` (${balconyCount} بالکن)` : ""}
                </span>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStudioOpen(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-brand-900/30 hover:bg-brand-500"
          >
            <Maximize2 className="h-4 w-4" />
            {enterLabel}
          </button>
        </div>

        {!readOnly && !hideVenueName ? (
          <div className="mt-4 border-t border-slate-200 pt-4 dark:border-white/10">
            <label className="mb-1 block text-xs font-bold text-slate-500 dark:text-slate-400">
              نام سالن در نقشه
            </label>
            <input
              value={layout.name}
              onChange={(e) => setLayout({ ...layout, name: e.target.value })}
              className="w-full max-w-md rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-slate-900 dark:text-white"
            />
          </div>
        ) : null}

        {!readOnly && templates.length > 0 ? (
          <div className="mt-4 border-t border-slate-200 pt-4 dark:border-white/10">
            <label className="mb-1 block text-xs font-bold text-slate-500 dark:text-slate-400">
              بارگذاری از قالب
            </label>
            <select
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-slate-900 dark:text-white"
              defaultValue=""
              onChange={(e) => {
                const tpl = templates.find((t) => t.id === Number(e.target.value));
                if (tpl) setLayout(normalizeLayout({ ...tpl.layout, name: tpl.name }));
              }}
            >
              <option value="">انتخاب قالب...</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {!readOnly && onSave ? (
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className="mt-4 rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-60 dark:border-white/15 dark:text-slate-300 dark:hover:bg-white/5"
          >
            {saving ? "در حال ذخیره..." : "ذخیره بدون ورود به استودیو"}
          </button>
        ) : null}
      </div>

      {studioOpen ? (
        <SeatingStudio
          layout={layout}
          onChange={setLayout}
          onSave={() => void handleSave()}
          onClose={() => setStudioOpen(false)}
          saving={saving}
          readOnly={readOnly}
        />
      ) : null}
    </>
  );
}
