"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  X,
  Armchair,
  Ban,
  Eraser,
  Footprints,
  Layers,
  Maximize2,
  Save,
  Theater,
} from "lucide-react";
import {
  applyStagePosition,
  applyStageRect,
  assignCellsToZone,
  cellInRect,
  countBookableSeats,
  createEmptyLayout,
  createZone,
  defaultStageRect,
  formatPriceLabel,
  normalizeLayout,
  resizeLayout,
  rowLabel,
} from "@/lib/seating/layout";
import type { SeatCell, SeatingLayout, StagePosition } from "@/lib/seating/types";

type PaintMode = "seat" | "empty" | "blocked" | "aisle";
type StudioTool = PaintMode | "stage";

type SeatingStudioProps = {
  layout: SeatingLayout;
  onChange: (layout: SeatingLayout) => void;
  onSave: () => void;
  onClose: () => void;
  saving?: boolean;
};

const STAGE_OPTIONS: { value: StagePosition; label: string }[] = [
  { value: "top", label: "بالا" },
  { value: "bottom", label: "پایین" },
  { value: "left", label: "چپ" },
  { value: "right", label: "راست" },
];

const TOOLS: { value: StudioTool; label: string; icon: typeof Armchair }[] = [
  { value: "seat", label: "صندلی", icon: Armchair },
  { value: "empty", label: "خالی", icon: Eraser },
  { value: "blocked", label: "مسدود", icon: Ban },
  { value: "aisle", label: "راهرو", icon: Footprints },
  { value: "stage", label: "صحنه", icon: Theater },
];

function cellClass(cell: SeatCell, selected: boolean, activeZoneId: string | null): string {
  const base =
    "relative flex h-8 w-8 items-center justify-center rounded text-[9px] font-bold transition sm:h-9 sm:w-9 ";
  if (selected) return base + "z-10 ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-950 ";
  if (cell.type === "stage") return base + "bg-violet-600 text-white cursor-pointer hover:bg-violet-500 ";
  if (cell.type === "blocked") return base + "bg-red-900/70 text-red-200 cursor-pointer ";
  if (cell.type === "aisle") return base + "bg-slate-700/80 text-slate-500 cursor-pointer ";
  if (cell.type === "empty") return base + "bg-slate-900/30 text-transparent cursor-pointer hover:bg-slate-800/50 ";
  if (!cell.available) return base + "bg-slate-700 text-slate-500 line-through cursor-pointer ";
  if (activeZoneId && cell.zoneId === activeZoneId) {
    return base + "bg-sky-600 text-white hover:bg-sky-500 cursor-pointer ";
  }
  return base + "bg-emerald-700/90 text-white hover:bg-emerald-600 cursor-pointer ";
}

export default function SeatingStudio({
  layout,
  onChange,
  onSave,
  onClose,
  saving = false,
}: SeatingStudioProps) {
  const [tool, setTool] = useState<StudioTool>("seat");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [rowPrice, setRowPrice] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const normalized = useMemo(() => normalizeLayout(layout), [layout]);
  const bookableCount = useMemo(() => countBookableSeats(normalized), [normalized]);
  const selected = normalized.cells.find((c) => c.id === selectedId) ?? null;
  const stageRect = normalized.stageRect!;

  const grid = useMemo(() => {
    const map = new Map<string, SeatCell>();
    for (const cell of normalized.cells) map.set(`${cell.row},${cell.col}`, cell);
    return map;
  }, [normalized.cells]);

  const update = useCallback(
    (next: SeatingLayout) => {
      onChange(normalizeLayout(next));
      setSelectedId(null);
    },
    [onChange]
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function paintCell(cell: SeatCell) {
    if (tool === "stage") {
      const rect = { ...stageRect };
      rect.rowStart = Math.min(rect.rowStart, cell.row);
      rect.rowEnd = Math.max(rect.rowEnd, cell.row);
      rect.colStart = Math.min(rect.colStart, cell.col);
      rect.colEnd = Math.max(rect.colEnd, cell.col);
      update(applyStageRect(normalized, rect));
      return;
    }

    if (cell.type === "stage") return;
    const nextCells = normalized.cells.map((c) => {
      if (c.id !== cell.id) return c;
      if (tool === "seat") {
        return {
          ...c,
          type: "seat" as const,
          available: true,
          label: c.label || `${rowLabel(c.row)}${c.col + 1}`,
          priceRial: c.priceRial || normalized.defaultPriceRial,
          priceLabel: formatPriceLabel(c.priceRial || normalized.defaultPriceRial),
        };
      }
      return {
        ...c,
        type: tool,
        available: false,
        label: tool === "aisle" ? "" : c.label,
      };
    });
    update({ ...normalized, cells: nextCells });
  }

  function handleCellPointer(cell: SeatCell) {
    paintCell(cell);
    setIsDragging(true);
  }

  function handleCellEnter(cell: SeatCell) {
    if (!isDragging) return;
    paintCell(cell);
  }

  useEffect(() => {
    function stopDrag() {
      setIsDragging(false);
    }
    window.addEventListener("mouseup", stopDrag);
    window.addEventListener("touchend", stopDrag);
    return () => {
      window.removeEventListener("mouseup", stopDrag);
      window.removeEventListener("touchend", stopDrag);
    };
  }, []);

  function updateSelected(partial: Partial<SeatCell>) {
    if (!selected) return;
    const nextCells = normalized.cells.map((c) => {
      if (c.id !== selected.id) return c;
      const merged = { ...c, ...partial };
      if (partial.priceRial !== undefined) {
        merged.priceLabel = formatPriceLabel(partial.priceRial);
      }
      return merged;
    });
    update({ ...normalized, cells: nextCells });
  }

  function applyRowPrice() {
    if (!selected || !rowPrice) return;
    const rial = Number(rowPrice.replace(/\D/g, ""));
    if (!Number.isFinite(rial)) return;
    const nextCells = normalized.cells.map((c) =>
      c.row === selected.row && c.type === "seat"
        ? { ...c, priceRial: rial, priceLabel: formatPriceLabel(rial) }
        : c
    );
    update({ ...normalized, cells: nextCells });
  }

  function expandStage(axis: "rows" | "cols", delta: number) {
    const rect = { ...stageRect };
    if (axis === "rows") {
      rect.rowEnd = Math.min(normalized.rows - 1, Math.max(rect.rowStart, rect.rowEnd + delta));
      if (delta < 0) rect.rowStart = Math.max(0, rect.rowStart + delta);
    } else {
      rect.colEnd = Math.min(normalized.cols - 1, Math.max(rect.colStart, rect.colEnd + delta));
      if (delta < 0) rect.colStart = Math.max(0, rect.colStart + delta);
    }
    update(applyStageRect(normalized, rect));
  }

  function addBalcony() {
    const name = prompt("نام بالکن (مثلاً بالکن شرقی):");
    if (!name?.trim()) return;
    const rowStart = Number(prompt("شماره ردیف شروع (۱ تا " + normalized.rows + "):", "2"));
    const rowEnd = Number(prompt("شماره ردیف پایان:", String(normalized.rows)));
    if (!Number.isFinite(rowStart) || !Number.isFinite(rowEnd)) return;
    const rect = {
      rowStart: Math.max(0, rowStart - 1),
      rowEnd: Math.min(normalized.rows - 1, rowEnd - 1),
      colStart: 0,
      colEnd: normalized.cols - 1,
    };
    const zone = createZone(normalized, "balcony", name.trim(), rect);
    const zones = [...(normalized.zones ?? []), zone];
    update(assignCellsToZone({ ...normalized, zones }, zone));
    setActiveZoneId(zone.id);
  }

  function removeZone(zoneId: string) {
    const zones = (normalized.zones ?? []).filter((z) => z.id !== zoneId);
    const cells = normalized.cells.map((c) =>
      c.zoneId === zoneId ? { ...c, zoneId: undefined } : c
    );
    update({ ...normalized, zones, cells });
    if (activeZoneId === zoneId) setActiveZoneId(null);
  }

  const zoneOverlays = (normalized.zones ?? []).map((zone) => ({
    zone,
    style: {
      gridRow: `${zone.rowStart + 2} / ${zone.rowEnd + 3}`,
      gridColumn: `${zone.colStart + 2} / ${zone.colEnd + 3}`,
    },
  }));

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-950 text-white" dir="rtl">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-slate-900 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-lg font-black">{normalized.name || "استودیو طراحی سالن"}</p>
          <p className="text-xs text-slate-400">
            {bookableCount.toLocaleString("fa-IR")} صندلی · {normalized.rows} ردیف × {normalized.cols} ستون
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={onSave}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black hover:bg-emerald-500 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? "در حال ذخیره..." : "ذخیره"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm font-bold hover:bg-white/5"
          >
            <X className="h-4 w-4" />
            بستن
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="w-64 shrink-0 overflow-y-auto border-l border-white/10 bg-slate-900/80 p-4">
          <p className="mb-2 text-xs font-bold text-slate-400">ابزارها</p>
          <div className="space-y-1">
            {TOOLS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTool(value)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold ${
                  tool === value ? "bg-emerald-600 text-white" : "hover:bg-white/5 text-slate-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          <p className="mb-2 mt-6 text-xs font-bold text-slate-400">صحنه یکپارچه</p>
          <div className="space-y-2 rounded-xl border border-white/10 bg-slate-950/60 p-3">
            <input
              value={normalized.stageLabel}
              onChange={(e) => update({ ...normalized, stageLabel: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-xs"
              placeholder="برچسب صحنه"
            />
            <select
              value={normalized.stagePosition}
              onChange={(e) =>
                update(
                  applyStagePosition(normalized, e.target.value as StagePosition)
                )
              }
              className="w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-xs"
            >
              {STAGE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  جای صحنه: {o.label}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              <button
                type="button"
                onClick={() => expandStage("rows", 1)}
                className="rounded bg-white/10 py-1 font-bold"
              >
                + ردیف صحنه
              </button>
              <button
                type="button"
                onClick={() => expandStage("rows", -1)}
                className="rounded bg-white/10 py-1 font-bold"
              >
                − ردیف صحنه
              </button>
              <button
                type="button"
                onClick={() => expandStage("cols", 1)}
                className="rounded bg-white/10 py-1 font-bold"
              >
                + عرض صحنه
              </button>
              <button
                type="button"
                onClick={() => expandStage("cols", -1)}
                className="rounded bg-white/10 py-1 font-bold"
              >
                − عرض صحنه
              </button>
            </div>
            <button
              type="button"
              onClick={() =>
                update(
                  applyStageRect(
                    normalized,
                    defaultStageRect(normalized.rows, normalized.cols, normalized.stagePosition)
                  )
                )
              }
              className="w-full rounded-lg border border-violet-500/40 py-1.5 text-[10px] font-bold text-violet-300"
            >
              بازنشانی صحنه
            </button>
          </div>

          <p className="mb-2 mt-6 flex items-center gap-1 text-xs font-bold text-slate-400">
            <Layers className="h-3.5 w-3.5" />
            جایگاه‌ها و بالکن‌ها
          </p>
          <div className="space-y-2">
            {(normalized.zones ?? []).map((zone) => (
              <div
                key={zone.id}
                className={`rounded-xl border p-2 text-xs ${
                  activeZoneId === zone.id
                    ? "border-sky-500 bg-sky-500/10"
                    : "border-white/10 bg-slate-950/40"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveZoneId(zone.id === activeZoneId ? null : zone.id)}
                  className="w-full text-right font-bold"
                >
                  {zone.name}
                  <span className="mt-0.5 block text-[10px] font-normal text-slate-400">
                    {zone.type === "balcony" ? "بالکن" : zone.type === "vip" ? "VIP" : "سالن"} ·
                    ردیف {zone.rowStart + 1}–{zone.rowEnd + 1}
                  </span>
                </button>
                {zone.type === "balcony" ? (
                  <button
                    type="button"
                    onClick={() => removeZone(zone.id)}
                    className="mt-1 text-[10px] text-red-400"
                  >
                    حذف
                  </button>
                ) : null}
              </div>
            ))}
            <button
              type="button"
              onClick={addBalcony}
              className="w-full rounded-xl border border-dashed border-white/20 py-2 text-xs font-bold text-slate-400 hover:border-white/40"
            >
              + افزودن بالکن
            </button>
          </div>

          <p className="mb-2 mt-6 text-xs font-bold text-slate-400">ابعاد شبکه</p>
          <div className="flex gap-2">
            <label className="flex-1 text-[10px]">
              ردیف
              <input
                type="number"
                min={4}
                max={40}
                value={normalized.rows}
                onChange={(e) =>
                  update(resizeLayout(normalized, Number(e.target.value), normalized.cols))
                }
                className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-1"
                dir="ltr"
              />
            </label>
            <label className="flex-1 text-[10px]">
              ستون
              <input
                type="number"
                min={4}
                max={50}
                value={normalized.cols}
                onChange={(e) =>
                  update(resizeLayout(normalized, normalized.rows, Number(e.target.value)))
                }
                className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-1"
                dir="ltr"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={() =>
              update(createEmptyLayout(normalized.name, normalized.rows, normalized.cols))
            }
            className="mt-2 w-full rounded-lg border border-white/15 py-1.5 text-[10px] font-bold"
          >
            بازنشانی کل شبکه
          </button>
        </aside>

        <main className="relative min-w-0 flex-1 overflow-auto p-4">
          <div className="mx-auto max-w-5xl">
            <div
              className="relative inline-grid gap-0.5 rounded-2xl border border-white/10 bg-slate-900/50 p-4"
              style={{
                gridTemplateColumns: `2.5rem repeat(${normalized.cols}, minmax(2rem, 2.25rem))`,
                gridTemplateRows: `1.75rem repeat(${normalized.rows}, minmax(2rem, 2.25rem))`,
              }}
              onMouseLeave={() => setIsDragging(false)}
            >
              <div className="col-start-1 row-start-1" />
              {Array.from({ length: normalized.cols }, (_, col) => (
                <div
                  key={`col-${col}`}
                  className="flex items-center justify-center text-[10px] font-bold text-slate-500"
                  style={{ gridColumn: col + 2, gridRow: 1 }}
                >
                  {col + 1}
                </div>
              ))}

              {zoneOverlays.map(({ zone, style }) => (
                <div
                  key={zone.id}
                  className="pointer-events-none rounded-xl border border-dashed opacity-30"
                  style={{
                    ...style,
                    borderColor: zone.color,
                    backgroundColor: `${zone.color}33`,
                  }}
                />
              ))}

              {Array.from({ length: normalized.rows }, (_, row) => (
                <div key={`row-wrap-${row}`} className="contents">
                  <div
                    className="flex items-center justify-center text-[11px] font-black text-amber-400/90"
                    style={{ gridColumn: 1, gridRow: row + 2 }}
                  >
                    {rowLabel(row)}
                  </div>
                  {Array.from({ length: normalized.cols }, (_, col) => {
                    const cell = grid.get(`${row},${col}`);
                    if (!cell) return null;
                    const inStage = cellInRect(row, col, stageRect);
                    const showStageLabel =
                      inStage &&
                      cell.row === stageRect.rowStart &&
                      cell.col ===
                        Math.floor((stageRect.colStart + stageRect.colEnd) / 2);

                    return (
                      <button
                        key={cell.id}
                        type="button"
                        title={
                          cell.type === "seat"
                            ? `${cell.label} — ${cell.priceLabel}`
                            : cell.label
                        }
                        style={{ gridColumn: col + 2, gridRow: row + 2 }}
                        onMouseDown={() => handleCellPointer(cell)}
                        onMouseEnter={() => handleCellEnter(cell)}
                        onClick={() => {
                          if (cell.type === "seat") setSelectedId(cell.id);
                        }}
                        className={
                          cellClass(cell, selectedId === cell.id, activeZoneId) +
                          (inStage && cell.type === "stage" ? " col-span-1 " : "")
                        }
                      >
                        {cell.type === "seat" ? (
                          <span>{cell.col + 1}</span>
                        ) : cell.type === "stage" && showStageLabel ? (
                          <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black sm:text-[10px]">
                            {normalized.stageLabel}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </main>

        <aside className="w-72 shrink-0 overflow-y-auto border-r border-white/10 bg-slate-900/80 p-4">
          {selected && selected.type === "seat" ? (
            <div>
              <p className="font-bold text-amber-200">صندلی {selected.label}</p>
              <p className="mt-1 text-xs text-slate-400">
                ردیف {rowLabel(selected.row)} · ستون {selected.col + 1}
              </p>
              <div className="mt-4 space-y-3">
                <div>
                  <label className="mb-1 block text-[10px] text-slate-400">برچسب</label>
                  <input
                    value={selected.label}
                    onChange={(e) => updateSelected({ label: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] text-slate-400">قیمت (ریال)</label>
                  <input
                    value={selected.priceRial}
                    onChange={(e) =>
                      updateSelected({
                        priceRial: Number(e.target.value.replace(/\D/g, "") || 0),
                      })
                    }
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-sm"
                    dir="ltr"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    placeholder="قیمت ردیف"
                    value={rowPrice}
                    onChange={(e) => setRowPrice(e.target.value)}
                    className="flex-1 rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-xs"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={applyRowPrice}
                    className="rounded-lg bg-white/10 px-2 py-1.5 text-[10px] font-bold"
                  >
                    ردیف {rowLabel(selected.row)}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-400">
              <Maximize2 className="mb-3 h-8 w-8 text-slate-600" />
              <p className="font-bold text-slate-300">راهنمای طراحی</p>
              <ul className="mt-3 space-y-2 text-xs leading-6">
                <li>با ابزار صندلی، هر خانه را به صندلی تبدیل کنید یا با «خالی» جای خالی بگذارید.</li>
                <li>صحنه را یکپارچه با ابزار صحنه یا دکمه‌های گسترش تنظیم کنید.</li>
                <li>بالکن‌ها را از پنل چپ اضافه کنید و محدوده ردیف‌ها را مشخص کنید.</li>
                <li>شماره ردیف‌ها در ستون طلایی و شماره ستون‌ها در بالای شبکه نمایش داده می‌شود.</li>
                <li>برای رسم سریع، کلیک کرده و بکشید.</li>
              </ul>
            </div>
          )}

          <div className="mt-8 border-t border-white/10 pt-4">
            <label className="mb-1 block text-[10px] text-slate-400">قیمت پیش‌فرض (ریال)</label>
            <input
              value={normalized.defaultPriceRial}
              onChange={(e) =>
                update({
                  ...normalized,
                  defaultPriceRial: Number(e.target.value.replace(/\D/g, "") || 0),
                })
              }
              className="w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-sm"
              dir="ltr"
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
