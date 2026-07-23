"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Armchair,
  Ban,
  Eraser,
  GripVertical,
  LayoutGrid,
  Redo2,
  RotateCw,
  Save,
  Sparkles,
  Tag,
  Undo2,
  X,
} from "lucide-react";
import {
  addCanvasSeat,
  addRowMarker,
  addSeatToRow,
  alignSeatsToNeighbors,
  applyClassicGridToCanvas,
  countBookableSeats,
  ensureRowLabels,
  faceSeatsTowardStage,
  formatPriceLabel,
  listOccupiedRows,
  moveCanvasSeats,
  moveRowMarker,
  moveStage,
  normalizeLayout,
  removeCanvasSeats,
  removeRowMarkers,
  removeRowSeats,
  resizeStage,
  resolveSeatDisplay,
  resolveStagePlacement,
  rotateCanvasSeats,
  rowLabel,
  seatsInRow,
  setSeatsSectionColor,
  syncRowMarkersFromSeats,
  updateRowMarkerLabel,
} from "@/lib/seating/layout";
import type { SeatCell, SeatingLayout } from "@/lib/seating/types";
import { seatingLayoutIsFree } from "@/lib/events/pricing";
import { SeatStatusLegend } from "@/components/seating/SeatMapVisuals";
import { SeatMapViewport } from "@/components/seating/SeatMapViewport";
import FreeformSeatBoard from "@/components/seating/FreeformSeatBoard";
import CanvasSetupWizard from "@/components/seating/CanvasSetupWizard";
import { cn } from "@/lib/utils";

type PaintMode = "seat" | "empty" | "blocked";
type StudioTool = PaintMode | "move" | "rotate" | "label";

const SECTION_COLORS = [
  "#f472b6",
  "#fb923c",
  "#7dd3fc",
  "#2dd4bf",
  "#c4b5fd",
  "#f87171",
];

const HISTORY_LIMIT = 60;

function cloneLayout(layout: SeatingLayout): SeatingLayout {
  return JSON.parse(JSON.stringify(layout)) as SeatingLayout;
}

type SeatingStudioProps = {
  layout: SeatingLayout;
  onChange: (layout: SeatingLayout) => void;
  onSave: () => void;
  onClose: () => void;
  saving?: boolean;
  readOnly?: boolean;
};

const STUDIO_TOOLS: { value: StudioTool; label: string; icon: typeof Armchair }[] = [
  { value: "move", label: "جابه‌جایی", icon: GripVertical },
  { value: "rotate", label: "چرخش", icon: RotateCw },
  { value: "label", label: "نشانه ردیف", icon: Tag },
  { value: "seat", label: "افزودن", icon: Armchair },
  { value: "empty", label: "پاک کردن", icon: Eraser },
  { value: "blocked", label: "مسدود", icon: Ban },
];

export default function SeatingStudio({
  layout,
  onChange,
  onSave,
  onClose,
  saving = false,
  readOnly = false,
}: SeatingStudioProps) {
  const [tool, setTool] = useState<StudioTool>(readOnly ? "seat" : "move");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [rowPrice, setRowPrice] = useState("");
  const [draftRows, setDraftRows] = useState(layout.rows);
  const [draftCols, setDraftCols] = useState(layout.cols);
  const [historyIndex, setHistoryIndex] = useState(0);
  const historyRef = useRef<SeatingLayout[]>([cloneLayout(normalizeLayout(layout))]);
  const historyIndexRef = useRef(0);
  const skipHistoryRef = useRef(false);
  const coalescingRef = useRef(false);

  const normalized = useMemo(() => normalizeLayout(layout), [layout]);
  const isFreePricing = seatingLayoutIsFree(normalized);
  const bookableCount = useMemo(() => countBookableSeats(normalized), [normalized]);
  const selected =
    normalized.cells.find((c) => selectedIds.includes(c.id)) ?? null;
  const selectedMarker =
    (normalized.rowMarkers ?? []).find((m) => m.id === selectedMarkerId) ?? null;
  const labels = ensureRowLabels(normalized);
  const rtl = normalized.seatNumbersRtl !== false;
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < historyRef.current.length - 1;

  const pushHistory = useCallback((next: SeatingLayout) => {
    const i = historyIndexRef.current;
    const stack = historyRef.current.slice(0, i + 1);
    stack.push(cloneLayout(next));
    while (stack.length > HISTORY_LIMIT) stack.shift();
    historyRef.current = stack;
    historyIndexRef.current = stack.length - 1;
    setHistoryIndex(stack.length - 1);
  }, []);

  const update = useCallback(
    (
      next: SeatingLayout,
      options?: { recordHistory?: boolean; coalesce?: boolean }
    ) => {
      const normalizedNext = normalizeLayout(next);
      onChange(normalizedNext);

      const record = options?.recordHistory !== false;
      if (!record || skipHistoryRef.current) return;

      if (options?.coalesce && coalescingRef.current && historyRef.current.length > 0) {
        const stack = [...historyRef.current];
        stack[historyIndexRef.current] = cloneLayout(normalizedNext);
        historyRef.current = stack;
        return;
      }

      if (options?.coalesce) {
        coalescingRef.current = true;
      }

      pushHistory(normalizedNext);
    },
    [onChange, pushHistory]
  );

  const commitGesture = useCallback(() => {
    coalescingRef.current = false;
  }, []);

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    const i = historyIndexRef.current - 1;
    skipHistoryRef.current = true;
    coalescingRef.current = false;
    historyIndexRef.current = i;
    setHistoryIndex(i);
    onChange(cloneLayout(historyRef.current[i]));
    skipHistoryRef.current = false;
  }, [onChange]);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    const i = historyIndexRef.current + 1;
    skipHistoryRef.current = true;
    coalescingRef.current = false;
    historyIndexRef.current = i;
    setHistoryIndex(i);
    onChange(cloneLayout(historyRef.current[i]));
    skipHistoryRef.current = false;
  }, [onChange]);

  useEffect(() => {
    setDraftRows(normalized.rows);
    setDraftCols(normalized.cols);
  }, [normalized.rows, normalized.cols]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA";

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        if (!typing) {
          e.preventDefault();
          undo();
        }
        return;
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))
      ) {
        if (!typing) {
          e.preventDefault();
          redo();
        }
        return;
      }
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, undo, redo]);

  function setLayoutPricing(free: boolean) {
    if (readOnly) return;
    const price =
      free ? 0 : normalized.defaultPriceRial > 0 ? normalized.defaultPriceRial : 350_000;
    update({
      ...normalized,
      defaultPriceRial: price,
      cells: normalized.cells.map((c) =>
        c.type === "seat"
          ? { ...c, priceRial: price, priceLabel: formatPriceLabel(price) }
          : c
      ),
    });
  }

  function updateSelected(partial: Partial<SeatCell>) {
    if (!selected || readOnly) return;
    const ids = selectedIds.length ? new Set(selectedIds) : new Set([selected.id]);
    const nextCells = normalized.cells.map((c) => {
      if (!ids.has(c.id)) return c;
      const merged = { ...c, ...partial };
      if (partial.priceRial !== undefined) {
        merged.priceLabel = formatPriceLabel(partial.priceRial);
      }
      return merged;
    });
    update({ ...normalized, cells: nextCells });
  }

  function clearSelectedSeat() {
    if (!selected || readOnly) return;
    update(removeCanvasSeats(normalized, selectedIds.length ? selectedIds : [selected.id]));
    setSelectedIds([]);
  }

  function applyRowPrice() {
    if (!selected || !rowPrice || readOnly) return;
    const rial = Number(rowPrice.replace(/\D/g, ""));
    if (!Number.isFinite(rial)) return;
    const nextCells = normalized.cells.map((c) =>
      c.row === selected.row && c.type === "seat"
        ? { ...c, priceRial: rial, priceLabel: formatPriceLabel(rial) }
        : c
    );
    update({ ...normalized, cells: nextCells });
  }

  function renameRow(row: number, value: string) {
    if (readOnly) return;
    const next = [...labels];
    next[row] = value || String(row + 1);
    update({ ...normalized, rowLabels: next });
  }

  function applyClassicDims() {
    if (readOnly) return;
    const rows = Math.min(40, Math.max(1, Number(draftRows) || 1));
    const cols = Math.min(50, Math.max(1, Number(draftCols) || 1));
    update(syncRowMarkersFromSeats(applyClassicGridToCanvas(normalized, rows, cols)));
  }

  const occupiedRows = useMemo(() => listOccupiedRows(normalized), [normalized]);

  function selectRow(rowIndex: number | null) {
    setSelectedRowIndex(rowIndex);
    setSelectedMarkerId(null);
    if (rowIndex === null) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(seatsInRow(normalized, rowIndex).map((s) => s.id));
  }

  function runCanvasSetup(rows: number, seatsPerRow: number) {
    const built = syncRowMarkersFromSeats(
      applyClassicGridToCanvas(
        { ...normalized, mode: "canvas" },
        rows,
        seatsPerRow
      )
    );
    update(built);
    setDraftRows(rows);
    setDraftCols(seatsPerRow);
    setShowSetupWizard(false);
    setSelectedRowIndex(null);
    setSelectedIds([]);
  }

  return (
    <div
      className="fixed inset-0 z-100 flex flex-col bg-neutral-100 text-neutral-900"
      dir="rtl"
    >
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 py-3 shadow-sm">
        <div className="min-w-0">
          <p className="truncate text-base font-black">
            {normalized.name || "طراحی سالن"}
          </p>
          <p className="text-xs text-neutral-500">
            {bookableCount.toLocaleString("fa-IR")} صندلی · بوم آزاد
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!readOnly ? (
            <>
              <button
                type="button"
                disabled={!canUndo}
                onClick={undo}
                className="rounded-xl border border-neutral-200 bg-white p-2.5 hover:bg-neutral-50 disabled:opacity-40"
                title="بازگشت (Ctrl+Z)"
                aria-label="بازگشت"
              >
                <Undo2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={!canRedo}
                onClick={redo}
                className="rounded-xl border border-neutral-200 bg-white p-2.5 hover:bg-neutral-50 disabled:opacity-40"
                title="جلو (Ctrl+Y)"
                aria-label="جلو"
              >
                <Redo2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={onSave}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-black text-white hover:bg-brand-600 disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {saving ? "ذخیره..." : "ذخیره"}
              </button>
            </>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-neutral-200 bg-white p-2.5 hover:bg-neutral-50"
            aria-label="بستن"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {!readOnly ? (
          <aside className="hidden w-64 shrink-0 overflow-y-auto border-l border-neutral-200 bg-white p-4 lg:block">
            <button
              type="button"
              onClick={() => {
                setShowSetupWizard(true);
                setTool("move");
              }}
              className="flex w-full flex-col items-center gap-1.5 rounded-xl border border-brand-500 bg-brand-50 px-2 py-3 text-xs font-bold text-brand-700 hover:bg-brand-100"
            >
              <LayoutGrid className="h-5 w-5" />
              شروع / تنظیم ردیف و صندلی
            </button>
            <p className="mt-2 text-[10px] leading-4 text-neutral-400">
              از ویزارد تعداد ردیف و صندلی را مشخص کنید، سپس صندلی‌ها را آزادانه
              جابه‌جا و ویرایش کنید.
            </p>

            <p className="mb-2 mt-6 text-xs font-black text-neutral-500">ابزار</p>
            <div className="grid grid-cols-2 gap-2">
              {STUDIO_TOOLS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTool(value)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-[11px] font-bold transition",
                    tool === value
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-neutral-200 text-neutral-600 hover:border-brand-300"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>

            <p className="mb-2 mt-6 text-xs font-black text-neutral-500">
              صحنه اجرا (نیم‌دایره)
            </p>
            <p className="mb-2 text-[10px] leading-4 text-neutral-400">
              صحنه را روی بوم بکشید تا هر جا داخل طرح بگذارید. بیرون از بوم نمی‌رود.
            </p>
            <label className="mb-2 block text-[10px] font-bold text-neutral-500">
              عنوان صحنه
              <input
                value={normalized.stageLabel || ""}
                onChange={(e) =>
                  update({ ...normalized, stageLabel: e.target.value || "صحنه اجرا" })
                }
                className="mt-1 w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm font-black outline-none focus:border-brand-500"
              />
            </label>
            <label className="mb-3 block text-[10px] font-bold text-neutral-500">
              عرض صحنه: {resolveStagePlacement(normalized).stageWidth}px
              <input
                type="range"
                min={160}
                max={Math.max(200, (normalized.canvasWidth ?? 960) - 16)}
                step={8}
                value={resolveStagePlacement(normalized).stageWidth}
                onChange={(e) =>
                  update(resizeStage(normalized, Number(e.target.value)), {
                    coalesce: true,
                  })
                }
                onPointerUp={commitGesture}
                className="mt-1 w-full accent-amber-500"
              />
            </label>

            <p className="mb-2 mt-6 text-xs font-black text-neutral-500">
              ردیف‌ها — کلیک برای ویرایش
            </p>
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-neutral-100 p-1.5">
              {occupiedRows.length === 0 ? (
                <p className="px-2 py-3 text-center text-[10px] text-neutral-400">
                  هنوز ردیفی نیست — از ویزارد شروع کنید
                </p>
              ) : (
                occupiedRows.map((row) => {
                  const count = seatsInRow(normalized, row).length;
                  const active = selectedRowIndex === row;
                  return (
                    <button
                      key={row}
                      type="button"
                      onClick={() => selectRow(active ? null : row)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-bold transition",
                        active
                          ? "bg-brand-500 text-white"
                          : "text-neutral-700 hover:bg-brand-50"
                      )}
                    >
                      <span>ردیف {rowLabel(row, normalized)}</span>
                      <span className={active ? "text-white/80" : "text-neutral-400"}>
                        {count.toLocaleString("fa-IR")} صندلی
                      </span>
                    </button>
                  );
                })
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowSetupWizard(true)}
              className="mt-2 w-full rounded-xl border border-dashed border-brand-300 py-2 text-xs font-bold text-brand-700 hover:bg-brand-50"
            >
              تنظیم دوباره ردیف و صندلی
            </button>

            <label className="mt-4 flex items-center gap-2 text-xs font-bold text-neutral-600">
              <input
                type="checkbox"
                checked={rtl}
                onChange={(e) =>
                  update({ ...normalized, seatNumbersRtl: e.target.checked })
                }
                className="accent-brand-500"
              />
              شماره‌گذاری راست به چپ
            </label>

            <label className="mt-3 flex items-center gap-2 text-xs font-bold text-neutral-600">
              <input
                type="checkbox"
                checked={normalized.snapEnabled !== false}
                onChange={(e) =>
                  update({ ...normalized, snapEnabled: e.target.checked })
                }
                className="accent-brand-500"
              />
              چسبیدن به نقاط (Snap)
            </label>
            <button
              type="button"
              onClick={() => update(syncRowMarkersFromSeats(normalized))}
              className="mt-4 w-full rounded-xl border border-neutral-200 py-2 text-xs font-bold text-neutral-600 hover:border-brand-300"
            >
              نشانه ردیف‌ها از صندلی‌ها
            </button>
            <button
              type="button"
              onClick={() => update(faceSeatsTowardStage(normalized, undefined, "upright"))}
              className="mt-2 w-full rounded-xl border border-amber-200 bg-amber-50 py-2 text-xs font-bold text-amber-900"
            >
              مرکز + شماره رو به بیننده
            </button>

            <p className="mb-2 mt-6 text-xs font-black text-neutral-500">
              ساخت شبکه ردیف×ستون
            </p>
            <div className="flex gap-2">
              <label className="flex-1 text-[10px] font-bold text-neutral-500">
                ردیف
                <input
                  type="number"
                  min={1}
                  max={40}
                  value={draftRows}
                  onChange={(e) => setDraftRows(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-brand-500"
                  dir="ltr"
                />
              </label>
              <label className="flex-1 text-[10px] font-bold text-neutral-500">
                ستون
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={draftCols}
                  onChange={(e) => setDraftCols(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-brand-500"
                  dir="ltr"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={applyClassicDims}
              className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-neutral-900 py-2 text-xs font-bold text-white hover:bg-neutral-800"
            >
              <Sparkles className="h-3.5 w-3.5" />
              اعمال شبکه روی بوم
            </button>
            <button
              type="button"
              onClick={() =>
                update(
                  applyClassicGridToCanvas(normalized, draftRows, draftCols)
                )
              }
              className="mt-2 w-full rounded-xl border border-neutral-200 py-2 text-xs font-bold text-neutral-500"
            >
              پاک کردن و ساخت دوباره شبکه
            </button>

            <div className="mt-6 border-t border-neutral-100 pt-4">
              <p className="mb-2 text-xs font-black text-neutral-500">قیمت‌گذاری</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLayoutPricing(true)}
                  className={cn(
                    "rounded-xl border px-2 py-2 text-xs font-black",
                    isFreePricing
                      ? "border-brand-500 bg-brand-500 text-white"
                      : "border-neutral-200"
                  )}
                >
                  رایگان
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutPricing(false)}
                  className={cn(
                    "rounded-xl border px-2 py-2 text-xs font-black",
                    !isFreePricing
                      ? "border-brand-500 bg-brand-500 text-white"
                      : "border-neutral-200"
                  )}
                >
                  قیمت‌دار
                </button>
              </div>
            </div>
          </aside>
        ) : null}

        <main className="min-w-0 flex-1 overflow-auto p-4 sm:p-6">
          <div className="mx-auto max-w-6xl rounded-3xl bg-white p-5 shadow-[0_8px_40px_rgba(0,0,0,0.06)] sm:p-8">
            <SeatMapViewport>
              <FreeformSeatBoard
                layout={normalized}
                selectedIds={selectedIds}
                selectedMarkerId={selectedMarkerId}
                selectedRowIndex={selectedRowIndex}
                enableRowSelection
                readOnly={readOnly}
                tool={
                  tool === "empty"
                    ? "erase"
                    : tool === "blocked"
                      ? "blocked"
                      : tool === "seat"
                        ? "seat"
                        : tool === "rotate"
                          ? "rotate"
                          : tool === "label"
                            ? "label"
                            : "move"
                }
                onSelectSeats={setSelectedIds}
                onSelectRow={setSelectedRowIndex}
                onSelectMarker={setSelectedMarkerId}
                onMoveSeats={(moves) =>
                  update(moveCanvasSeats(normalized, moves), { coalesce: true })
                }
                onRotateSeats={(ids, rotation, mode) =>
                  update(rotateCanvasSeats(normalized, ids, rotation, mode), {
                    coalesce: true,
                  })
                }
                onAddSeat={(x, y, type) => {
                  if (selectedRowIndex !== null && type === "seat") {
                    const next = addSeatToRow(normalized, selectedRowIndex);
                    update(next);
                    setSelectedIds(
                      seatsInRow(next, selectedRowIndex).map((s) => s.id)
                    );
                    return;
                  }
                  update(addCanvasSeat(normalized, x, y, type));
                }}
                onEraseSeats={(ids) => {
                  update(removeCanvasSeats(normalized, ids));
                  setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
                }}
                onAddRowMarker={(x, y) => update(addRowMarker(normalized, x, y))}
                onMoveRowMarker={(id, x, y) =>
                  update(moveRowMarker(normalized, id, x, y), { coalesce: true })
                }
                onEraseMarkers={(ids) => {
                  update(removeRowMarkers(normalized, ids));
                  setSelectedMarkerId(null);
                }}
                onMoveStage={(x, y) =>
                  update(moveStage(normalized, x, y), { coalesce: true })
                }
                onGestureEnd={commitGesture}
              />
            </SeatMapViewport>

            <div className="mt-6 border-t border-neutral-100 pt-5">
              <SeatStatusLegend />
              <p className="mt-3 text-center text-[11px] text-neutral-400">
                کلیک = یک صندلی · دابل‌کلیک یا Alt+کلیک = کل ردیف · از لیست ردیف‌ها هم می‌توانید
                ردیف را بگیرید · Ctrl+Z بازگشت
              </p>
            </div>
          </div>
        </main>

        <aside className="hidden w-72 shrink-0 overflow-y-auto border-r border-neutral-200 bg-white p-4 xl:block">
          {selectedRowIndex !== null ? (
            <div>
              <p className="font-black text-brand-700">
                ویرایش ردیف {rowLabel(selectedRowIndex, normalized)}
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                {seatsInRow(normalized, selectedRowIndex).length.toLocaleString("fa-IR")}{" "}
                صندلی — بکشید تا کل ردیف جابه‌جا شود · برای ویرایش یک صندلی، روی همان صندلی
                کلیک کنید
              </p>
              {!readOnly ? (
                <div className="mt-4 space-y-2">
                  <label className="block text-[10px] font-bold text-neutral-500">
                    نام ردیف
                    <input
                      value={labels[selectedRowIndex] ?? String(selectedRowIndex + 1)}
                      onChange={(e) => renameRow(selectedRowIndex, e.target.value)}
                      className="mt-1 w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm font-black outline-none focus:border-brand-500"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const next = addSeatToRow(normalized, selectedRowIndex);
                      update(next);
                      setSelectedIds(
                        seatsInRow(next, selectedRowIndex).map((s) => s.id)
                      );
                    }}
                    className="w-full rounded-xl bg-brand-500 py-2.5 text-xs font-black text-white hover:bg-brand-600"
                  >
                    + افزودن صندلی به این ردیف
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      update(
                        rotateCanvasSeats(
                          normalized,
                          seatsInRow(normalized, selectedRowIndex).map((s) => s.id),
                          5,
                          "delta"
                        )
                      )
                    }
                    className="w-full rounded-xl border border-neutral-200 py-2 text-xs font-bold"
                  >
                    چرخش ردیف ۵°
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      update(
                        rotateCanvasSeats(
                          normalized,
                          seatsInRow(normalized, selectedRowIndex).map((s) => s.id),
                          -5,
                          "delta"
                        )
                      )
                    }
                    className="w-full rounded-xl border border-neutral-200 py-2 text-xs font-bold"
                  >
                    چرخش ردیف −۵°
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      update(removeRowSeats(normalized, selectedRowIndex));
                      selectRow(null);
                    }}
                    className="w-full rounded-xl border border-red-200 py-2 text-xs font-bold text-red-600"
                  >
                    حذف کل ردیف
                  </button>
                  <button
                    type="button"
                    onClick={() => selectRow(null)}
                    className="w-full rounded-xl border border-neutral-200 py-2 text-xs font-bold text-neutral-500"
                  >
                    لغو انتخاب ردیف
                  </button>
                </div>
              ) : null}
            </div>
          ) : selectedMarker ? (
            <div>
              <p className="font-black text-brand-700">نشانه ردیف</p>
              <p className="mt-1 text-xs text-neutral-500">
                روی بوم جابه‌جا کنید یا متن را عوض کنید
              </p>
              {!readOnly ? (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="mb-1 block text-[10px] font-bold text-neutral-500">
                      عنوان ردیف (A / ۱ / VIP…)
                    </label>
                    <input
                      value={selectedMarker.label}
                      onChange={(e) =>
                        update(
                          updateRowMarkerLabel(
                            normalized,
                            selectedMarker.id,
                            e.target.value
                          )
                        )
                      }
                      className="w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm font-black outline-none focus:border-brand-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      update(removeRowMarkers(normalized, [selectedMarker.id]));
                      setSelectedMarkerId(null);
                    }}
                    className="w-full rounded-xl border border-red-200 py-2 text-xs font-bold text-red-600"
                  >
                    حذف نشانه
                  </button>
                </div>
              ) : null}
            </div>
          ) : selected && (selected.type === "seat" || selected.type === "blocked") ? (
            <div>
              <p className="font-black text-brand-700">
                {selectedIds.length > 1
                  ? `${selectedIds.length.toLocaleString("fa-IR")} صندلی انتخاب‌شده`
                  : `صندلی ${selected.label}`}
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                ردیف {rowLabel(selected.row, normalized)} · زاویه{" "}
                {Math.round(selected.rotation ?? 0)}°
              </p>
              {!readOnly ? (
                <div className="mt-4 space-y-3">
                  <button
                    type="button"
                    onClick={() => selectRow(selected.row)}
                    className="w-full rounded-xl border border-brand-200 bg-brand-50 py-2 text-xs font-black text-brand-700"
                  >
                    انتخاب کل ردیف {rowLabel(selected.row, normalized)}
                  </button>
                  <label className="block text-[10px] font-bold text-neutral-500">
                    چرخش ({Math.round(selected.rotation ?? 0)}°)
                    <input
                      type="range"
                      min={-90}
                      max={90}
                      step={1}
                      value={selected.rotation ?? 0}
                      onChange={(e) =>
                        update(
                          rotateCanvasSeats(
                            normalized,
                            selectedIds,
                            Number(e.target.value),
                            "absolute"
                          )
                        )
                      }
                      className="mt-1 w-full accent-brand-500"
                    />
                  </label>
                  <div className="flex gap-1">
                    {[-45, -15, 0, 15, 45].map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() =>
                          update(
                            rotateCanvasSeats(normalized, selectedIds, a, "absolute")
                          )
                        }
                        className="flex-1 rounded-lg border border-neutral-200 py-1 text-[10px] font-bold hover:border-brand-400"
                      >
                        {a}°
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      update(
                        alignSeatsToNeighbors(
                          normalized,
                          selectedIds.length ? selectedIds : [selected.id]
                        )
                      )
                    }
                    className="w-full rounded-xl border border-sky-200 bg-sky-50 py-2 text-xs font-bold text-sky-800"
                  >
                    تراز با همسایه‌ها (ردیف/ستون)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      update(
                        faceSeatsTowardStage(
                          normalized,
                          selectedIds.length ? selectedIds : [selected.id],
                          "upright"
                        )
                      )
                    }
                    className="w-full rounded-xl border border-amber-200 bg-amber-50 py-2 text-xs font-bold text-amber-900"
                  >
                    شماره رو به بیننده (۰°)
                  </button>
                  <div>
                    <p className="mb-1.5 text-[10px] font-bold text-neutral-500">
                      رنگ بخش
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {SECTION_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          title={color}
                          onClick={() =>
                            update(
                              setSeatsSectionColor(normalized, selectedIds, color)
                            )
                          }
                          className="h-7 w-7 rounded-md border border-black/10"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          update(
                            setSeatsSectionColor(normalized, selectedIds, undefined)
                          )
                        }
                        className="rounded-md border border-neutral-200 px-2 text-[10px] font-bold"
                      >
                        پیش‌فرض
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
              {!readOnly ? (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="mb-1 block text-[10px] font-bold text-neutral-500">
                      شماره صندلی (روی نقشه)
                    </label>
                    <input
                      value={
                        selected.seatNumber ??
                        resolveSeatDisplay(selected, normalized)
                      }
                      onChange={(e) => {
                        const seatNumber = e.target.value;
                        const ids = new Set(
                          selectedIds.length ? selectedIds : [selected.id]
                        );
                        update({
                          ...normalized,
                          cells: normalized.cells.map((c) => {
                            if (!ids.has(c.id)) return c;
                            const display =
                              seatNumber.trim() ||
                              resolveSeatDisplay(
                                { ...c, seatNumber: undefined },
                                normalized
                              );
                            return {
                              ...c,
                              seatNumber: seatNumber.trim() || undefined,
                              label: `${rowLabel(c.row, normalized)}-${display}`,
                            };
                          }),
                        });
                      }}
                      className="w-full rounded-lg border border-brand-300 bg-brand-50/40 px-2 py-1.5 text-sm font-black outline-none focus:border-brand-500"
                      dir="ltr"
                      placeholder="مثلاً ۱ یا A12"
                    />
                    <p className="mt-1 text-[10px] text-neutral-400">
                      هر شماره‌ای بگذارید؛ روی خود صندلی نمایش داده می‌شود.
                    </p>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold text-neutral-500">
                      برچسب کامل
                    </label>
                    <input
                      value={selected.label}
                      onChange={(e) => updateSelected({ label: e.target.value })}
                      className="w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm outline-none focus:border-brand-500"
                    />
                  </div>
                  {!isFreePricing ? (
                    <>
                      <div>
                        <label className="mb-1 block text-[10px] font-bold text-neutral-500">
                          قیمت (ریال)
                        </label>
                        <input
                          value={selected.priceRial}
                          onChange={(e) =>
                            updateSelected({
                              priceRial: Number(e.target.value.replace(/\D/g, "") || 0),
                            })
                          }
                          className="w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm outline-none focus:border-brand-500"
                          dir="ltr"
                        />
                      </div>
                      <div className="flex gap-2">
                        <input
                          placeholder="قیمت کل ردیف"
                          value={rowPrice}
                          onChange={(e) => setRowPrice(e.target.value)}
                          className="flex-1 rounded-lg border border-neutral-300 px-2 py-1.5 text-xs outline-none focus:border-brand-500"
                          dir="ltr"
                        />
                        <button
                          type="button"
                          onClick={applyRowPrice}
                          className="rounded-lg bg-brand-50 px-2 py-1.5 text-[10px] font-bold text-brand-700"
                        >
                          اعمال
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="rounded-lg bg-brand-50 px-3 py-2 text-xs font-bold text-brand-700">
                      رویداد رایگان است.
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={clearSelectedSeat}
                    className="w-full rounded-xl border border-red-200 py-2 text-xs font-bold text-red-600"
                  >
                    حذف صندلی
                  </button>
                </div>
              ) : (
                <p className="mt-4 text-sm text-neutral-600">
                  قیمت: {isFreePricing ? "رایگان" : selected.priceLabel}
                </p>
              )}
            </div>
          ) : (
            <div className="text-sm text-neutral-500">
              <p className="font-black text-neutral-800">استودیو حرفه‌ای</p>
              <ul className="mt-3 space-y-2 text-xs leading-6">
                <li>
                  از ویزارد تعداد ردیف و صندلی هر ردیف را مشخص کنید.
                </li>
                <li>
                  کلیک روی صندلی = ویرایش همان صندلی؛ دابل‌کلیک یا لیست ردیف = کل ردیف.
                </li>
                <li>
                  صحنه نیم‌دایره را روی بوم بکشید و هر جا داخل طرح بگذارید.
                </li>
                <li>
                  با انتخاب صندلی می‌توانید شماره دلخواه روی آن بگذارید.
                </li>
                <li>
                  <strong>Ctrl+Z</strong> برای بازگشت یک قدم.
                </li>
              </ul>
            </div>
          )}
        </aside>
      </div>

      {showSetupWizard && !readOnly ? (
        <CanvasSetupWizard
          initialRows={draftRows}
          initialCols={draftCols}
          onConfirm={runCanvasSetup}
          onSkip={() => setShowSetupWizard(false)}
        />
      ) : null}
    </div>
  );
}
