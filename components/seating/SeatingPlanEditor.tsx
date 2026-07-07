"use client";

import { useMemo, useState } from "react";
import { LayoutGrid, Maximize2 } from "lucide-react";
import SeatingStudio from "@/components/seating/SeatingStudio";
import { countBookableSeats, normalizeLayout } from "@/lib/seating/layout";
import type { SeatingLayout } from "@/lib/seating/types";

type SeatingPlanEditorProps = {
  initialLayout: SeatingLayout;
  templates?: { id: number; name: string; layout: SeatingLayout }[];
  onSave: (layout: SeatingLayout) => Promise<void>;
  saving?: boolean;
  hideVenueName?: boolean;
};

export default function SeatingPlanEditor({
  initialLayout,
  templates = [],
  onSave,
  saving = false,
  hideVenueName = false,
}: SeatingPlanEditorProps) {
  const [layout, setLayout] = useState<SeatingLayout>(() => normalizeLayout(initialLayout));
  const [studioOpen, setStudioOpen] = useState(false);

  const bookableCount = useMemo(() => countBookableSeats(layout), [layout]);
  const zoneCount = layout.zones?.length ?? 0;
  const balconyCount = layout.zones?.filter((z) => z.type === "balcony").length ?? 0;

  async function handleSave() {
    await onSave(normalizeLayout(layout));
    setStudioOpen(false);
  }

  return (
    <>
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-emerald-400" />
              <p className="text-base font-black text-white">طراحی سالن و صندلی‌گذاری</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              صحنه یکپارچه، بالکن‌ها، جایگاه‌ها و چیدمان آزاد صندلی‌ها را در استودیوی طراحی تنظیم
              کنید.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 font-bold text-emerald-300">
                {bookableCount.toLocaleString("fa-IR")} صندلی
              </span>
              <span className="rounded-full bg-violet-500/20 px-3 py-1 font-bold text-violet-300">
                {layout.rows} ردیف × {layout.cols} ستون
              </span>
              {zoneCount > 0 ? (
                <span className="rounded-full bg-sky-500/20 px-3 py-1 font-bold text-sky-300">
                  {zoneCount} جایگاه
                  {balconyCount > 0 ? ` (${balconyCount} بالکن)` : ""}
                </span>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStudioOpen(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/30 hover:bg-emerald-500"
          >
            <Maximize2 className="h-4 w-4" />
            ورود به استودیو طراحی
          </button>
        </div>

        {!hideVenueName ? (
          <div className="mt-4 border-t border-white/10 pt-4">
            <label className="mb-1 block text-xs font-bold text-slate-400">نام سالن در نقشه</label>
            <input
              value={layout.name}
              onChange={(e) => setLayout({ ...layout, name: e.target.value })}
              className="w-full max-w-md rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm"
            />
          </div>
        ) : null}

        {templates.length > 0 ? (
          <div className="mt-4 border-t border-white/10 pt-4">
            <label className="mb-1 block text-xs font-bold text-slate-400">بارگذاری از قالب</label>
            <select
              className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm"
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

        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
          className="mt-4 rounded-xl border border-white/15 px-5 py-2.5 text-sm font-bold text-slate-300 hover:bg-white/5 disabled:opacity-60"
        >
          {saving ? "در حال ذخیره..." : "ذخیره بدون ورود به استودیو"}
        </button>
      </div>

      {studioOpen ? (
        <SeatingStudio
          layout={layout}
          onChange={setLayout}
          onSave={() => void handleSave()}
          onClose={() => setStudioOpen(false)}
          saving={saving}
        />
      ) : null}
    </>
  );
}
