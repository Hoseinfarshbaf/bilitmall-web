"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  closestCenter,
} from "@dnd-kit/core";
import {
  Armchair,
  Ban,
  Eraser,
  Grid3x3,
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
  addAngledSeatBlock,
  addArcSeatRow,
  addCanvasSeat,
  addRowMarker,
  alignSeatsToNeighbors,
  applyClassicGridToCanvas,
  applyStagePosition,
  assignCellsToZone,
  countBookableSeats,
  createEmptyLayout,
  createZone,
  ensureRowLabels,
  faceSeatsTowardStage,
  formatPriceLabel,
  moveCanvasSeats,
  moveRowMarker,
  moveSeatCell,
  normalizeLayout,
  removeCanvasSeats,
  removeRowMarkers,
  resizeLayout,
  rotateCanvasSeats,
  rowLabel,
  seatDisplayNumber,
  seatLabel,
  setSeatsSectionColor,
  switchToCanvasMode,
  switchToClassicMode,
  syncRowMarkersFromSeats,
  updateRowMarkerLabel,
} from "@/lib/seating/layout";
import type { SeatCell, SeatingLayout, StagePosition } from "@/lib/seating/types";
import { seatingLayoutIsFree } from "@/lib/events/pricing";
import {
  CurvedStageBanner,
  SeatBox,
  SeatStatusLegend,
} from "@/components/seating/SeatMapVisuals";
import { SeatMapViewport, SEAT_ZOOM_ATTR } from "@/components/seating/SeatMapViewport";
import FreeformSeatBoard from "@/components/seating/FreeformSeatBoard";
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

const STAGE_OPTIONS: { value: StagePosition; label: string }[] = [
  { value: "top", label: "بالا" },
  { value: "bottom", label: "پایین" },
  { value: "left", label: "چپ" },
  { value: "right", label: "راست" },
];

const CLASSIC_TOOLS: { value: StudioTool; label: string; icon: typeof Armchair }[] = [
  { value: "move", label: "جابه‌جایی", icon: GripVertical },
  { value: "seat", label: "صندلی", icon: Armchair },
  { value: "empty", label: "خالی", icon: Eraser },
  { value: "blocked", label: "غیرقابل خرید", icon: Ban },
];

const CANVAS_TOOLS: { value: StudioTool; label: string; icon: typeof Armchair }[] = [
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
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [rowPrice, setRowPrice] = useState("");
  const [isPainting, setIsPainting] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [draftRows, setDraftRows] = useState(layout.rows);
  const [draftCols, setDraftCols] = useState(layout.cols);
  const [blockAngle, setBlockAngle] = useState(-35);
  const [historyIndex, setHistoryIndex] = useState(0);
  const historyRef = useRef<SeatingLayout[]>([cloneLayout(normalizeLayout(layout))]);
  const historyIndexRef = useRef(0);
  const skipHistoryRef = useRef(false);
  const coalescingRef = useRef(false);

  const normalized = useMemo(() => normalizeLayout(layout), [layout]);
  const isCanvas = normalized.mode === "canvas";
  const isFreePricing = seatingLayoutIsFree(normalized);
  const bookableCount = useMemo(() => countBookableSeats(normalized), [normalized]);
  const selected =
    normalized.cells.find((c) => selectedIds.includes(c.id)) ?? null;
  const selectedMarker =
    (normalized.rowMarkers ?? []).find((m) => m.id === selectedMarkerId) ?? null;
  const labels = ensureRowLabels(normalized);
  const rtl = normalized.seatNumbersRtl !== false;
  const tools = isCanvas ? CANVAS_TOOLS : CLASSIC_TOOLS;
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < historyRef.current.length - 1;

  const grid = useMemo(() => {
    const map = new Map<string, SeatCell>();
    for (const cell of normalized.cells) map.set(`${cell.row},${cell.col}`, cell);
    return map;
  }, [normalized.cells]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

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

  useEffect(() => {
    function stopPaint() {
      setIsPainting(false);
    }
    window.addEventListener("mouseup", stopPaint);
    window.addEventListener("touchend", stopPaint);
    return () => {
      window.removeEventListener("mouseup", stopPaint);
      window.removeEventListener("touchend", stopPaint);
    };
  }, []);

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

  function paintCell(cell: SeatCell) {
    if (readOnly || tool === "move" || tool === "rotate" || tool === "label") return;
    const nextCells = normalized.cells.map((c) => {
      if (c.id !== cell.id) return c;
      if (tool === "seat") {
        return {
          ...c,
          type: "seat" as const,
          available: true,
          label: seatLabel(c.row, c.col, normalized),
          priceRial: c.priceRial || normalized.defaultPriceRial,
          priceLabel: formatPriceLabel(c.priceRial || normalized.defaultPriceRial),
        };
      }
      const paintType: "empty" | "blocked" = tool === "blocked" ? "blocked" : "empty";
      return {
        ...c,
        type: paintType,
        available: false,
        label: paintType === "empty" ? "" : c.label,
      };
    });
    update({ ...normalized, cells: nextCells });
  }

  function handleDragStart(event: DragStartEvent) {
    setDragId(String(event.active.id));
    setSelectedIds([String(event.active.id)]);
  }

  function handleDragEnd(event: DragEndEvent) {
    const fromId = String(event.active.id);
    const toId = event.over ? String(event.over.id) : null;
    setDragId(null);
    if (!toId || readOnly || tool !== "move") return;
    update(moveSeatCell(normalized, fromId, toId));
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
    if (isCanvas) {
      update(removeCanvasSeats(normalized, selectedIds.length ? selectedIds : [selected.id]));
    } else {
      const nextCells = normalized.cells.map((c) =>
        c.id === selected.id
          ? {
              ...c,
              type: "empty" as const,
              available: false,
              label: "",
              zoneId: undefined,
            }
          : c
      );
      update({ ...normalized, cells: nextCells });
    }
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

  function addBalcony() {
    if (readOnly) return;
    const name = prompt("نام بالکن (مثلاً بالکن شرقی):");
    if (!name?.trim()) return;
    const rowStart = Number(
      prompt("شماره ردیف شروع (۱ تا " + normalized.rows + "):", "2")
    );
    const rowEnd = Number(
      prompt("شماره ردیف پایان:", String(normalized.rows))
    );
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

  function applyClassicDims() {
    if (readOnly) return;
    const rows = Math.min(40, Math.max(1, Number(draftRows) || 1));
    const cols = Math.min(50, Math.max(1, Number(draftCols) || 1));
    if (isCanvas) {
      update(applyClassicGridToCanvas(normalized, rows, cols));
    } else {
      update(resizeLayout(normalized, rows, cols));
    }
  }

  const dragCell = dragId
    ? normalized.cells.find((c) => c.id === dragId) ?? null
    : null;

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
            {bookableCount.toLocaleString("fa-IR")} صندلی
            {isCanvas
              ? " · بوم آزاد"
              : ` · ${normalized.rows} ردیف × ${normalized.cols} ستون`}
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
            <p className="mb-2 text-xs font-black text-neutral-500">حالت طراحی</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!isCanvas) return;
                  update(switchToClassicMode(normalized));
                  setTool("move");
                }}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-[11px] font-bold",
                  !isCanvas
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-neutral-200 text-neutral-600"
                )}
              >
                <Grid3x3 className="h-4 w-4" />
                کلاسیک
              </button>
              <button
                type="button"
                onClick={() => {
                  if (isCanvas) return;
                  update(switchToCanvasMode(normalized));
                  setTool("move");
                }}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-[11px] font-bold",
                  isCanvas
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-neutral-200 text-neutral-600"
                )}
              >
                <LayoutGrid className="h-4 w-4" />
                بوم آزاد
              </button>
            </div>
            <p className="mt-2 text-[10px] leading-4 text-neutral-400">
              {isCanvas
                ? "روی کاغذ نقطه‌ای صندلی بگذارید و آزاد جابه‌جا کنید. شبکه کلاسیک هم از پایین قابل ساخت است."
                : "شبکه ردیف×ستون — برای جایگذاری آزاد به بوم بروید."}
            </p>

            <p className="mb-2 mt-6 text-xs font-black text-neutral-500">ابزار</p>
            <div className="grid grid-cols-2 gap-2">
              {tools.map(({ value, label, icon: Icon }) => (
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
              موقعیت بنر صحنه
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {STAGE_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => update(applyStagePosition(normalized, o.value))}
                  className={cn(
                    "rounded-lg border px-2 py-1.5 text-[11px] font-bold",
                    normalized.stagePosition === o.value
                      ? "border-sky-500 bg-sky-50 text-sky-700"
                      : "border-neutral-200 text-neutral-600"
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>

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

            {isCanvas ? (
              <>
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
                <label className="mt-3 flex items-center gap-2 text-xs font-bold text-neutral-600">
                  <input
                    type="checkbox"
                    checked={normalized.stageStyle !== "banner"}
                    onChange={(e) =>
                      update({
                        ...normalized,
                        stageStyle: e.target.checked ? "semicircle" : "banner",
                      })
                    }
                    className="accent-brand-500"
                  />
                  صحنه نیم‌دایره تئاتری
                </label>

                <p className="mb-2 mt-6 text-xs font-black text-neutral-500">
                  بلوک زاویه‌دار (مثل عکس)
                </p>
                <label className="mb-2 block text-[10px] font-bold text-neutral-500">
                  زاویه بلوک: {blockAngle}°
                  <input
                    type="range"
                    min={-75}
                    max={75}
                    step={5}
                    value={blockAngle}
                    onChange={(e) => setBlockAngle(Number(e.target.value))}
                    className="mt-1 w-full accent-brand-500"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const w = normalized.canvasWidth ?? 960;
                    const h = normalized.canvasHeight ?? 720;
                    update(
                      addAngledSeatBlock(normalized, {
                        rows: Math.min(4, draftRows),
                        cols: Math.min(8, draftCols),
                        originX: w / 2 - 120,
                        originY: h / 2 - 80,
                        rotation: blockAngle,
                        sectionColor: SECTION_COLORS[Math.abs(blockAngle) > 20 ? 1 : 2],
                      })
                    );
                  }}
                  className="w-full rounded-xl border border-brand-200 bg-brand-50 py-2 text-xs font-bold text-brand-700"
                >
                  افزودن بلوک چرخیده
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const w = normalized.canvasWidth ?? 960;
                    const h = normalized.canvasHeight ?? 720;
                    update(
                      addArcSeatRow(normalized, {
                        centerX: w / 2,
                        centerY: h - 40,
                        radius: Math.min(w, h) * 0.42,
                        startDeg: 200,
                        endDeg: 340,
                        count: Math.max(8, draftCols),
                        sectionColor: SECTION_COLORS[3],
                      })
                    );
                  }}
                  className="mt-2 w-full rounded-xl border border-teal-200 bg-teal-50 py-2 text-xs font-bold text-teal-800"
                >
                  افزودن ردیف قوسی
                </button>
                <button
                  type="button"
                  onClick={() => update(syncRowMarkersFromSeats(normalized))}
                  className="mt-2 w-full rounded-xl border border-neutral-200 py-2 text-xs font-bold text-neutral-600 hover:border-brand-300"
                >
                  نشانه ردیف‌ها از صندلی‌ها
                </button>
                <button
                  type="button"
                  onClick={() => update(faceSeatsTowardStage(normalized, undefined, "upright"))}
                  className="mt-2 w-full rounded-xl border border-amber-200 bg-amber-50 py-2 text-xs font-bold text-amber-900"
                >
                  همه صندلی‌ها رو به صحنه
                </button>
              </>
            ) : null}

            <p className="mb-2 mt-6 text-xs font-black text-neutral-500">
              {isCanvas ? "تولید شبکه کلاسیک روی بوم" : "ابعاد شبکه"}
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
              {isCanvas ? "اعمال شبکه روی بوم" : "اعمال ابعاد"}
            </button>

            {!isCanvas ? (
              <>
                <button
                  type="button"
                  onClick={addBalcony}
                  className="mt-4 w-full rounded-xl border border-dashed border-neutral-300 py-2 text-xs font-bold text-neutral-500 hover:border-brand-400"
                >
                  + افزودن بالکن
                </button>
                {activeZoneId ? (
                  <p className="mt-1 text-[10px] text-neutral-400">
                    بالکن فعال: {activeZoneId}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={() =>
                    update(
                      createEmptyLayout(
                        normalized.name,
                        normalized.rows,
                        normalized.cols
                      )
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-neutral-200 py-2 text-xs font-bold text-neutral-500"
                >
                  بازنشانی شبکه
                </button>
              </>
            ) : (
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
            )}

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
              {isCanvas ? (
                <FreeformSeatBoard
                  layout={normalized}
                  selectedIds={selectedIds}
                  selectedMarkerId={selectedMarkerId}
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
                  onSelectMarker={setSelectedMarkerId}
                  onMoveSeats={(moves) =>
                    update(moveCanvasSeats(normalized, moves), { coalesce: true })
                  }
                  onRotateSeats={(ids, rotation, mode) =>
                    update(rotateCanvasSeats(normalized, ids, rotation, mode), {
                      coalesce: true,
                    })
                  }
                  onAddSeat={(x, y, type) =>
                    update(addCanvasSeat(normalized, x, y, type))
                  }
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
                  onGestureEnd={commitGesture}
                />
              ) : (
                <>
                  {normalized.stagePosition !== "bottom" ? (
                    <CurvedStageBanner
                      label={normalized.stageLabel || "صحنه اجرا"}
                      position={normalized.stagePosition}
                    />
                  ) : null}

                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  >
                    <div
                      className="flex w-max flex-col items-center gap-1.5"
                      {...{ [SEAT_ZOOM_ATTR]: "" }}
                    >
                      {Array.from({ length: normalized.rows }, (_, row) => (
                        <div key={row} className="flex items-center gap-2 sm:gap-3">
                          {!readOnly ? (
                            <input
                              value={labels[row] ?? String(row + 1)}
                              onChange={(e) => renameRow(row, e.target.value)}
                              className="w-8 shrink-0 rounded-md border border-transparent bg-transparent text-center text-sm font-black text-neutral-500 outline-none hover:border-neutral-200 focus:border-brand-400 sm:w-10"
                              title="نام ردیف"
                            />
                          ) : (
                            <span className="w-8 shrink-0 text-center text-sm font-black text-neutral-500 sm:w-10">
                              {rowLabel(row, normalized)}
                            </span>
                          )}

                          <div className="flex items-center gap-1">
                            {Array.from({ length: normalized.cols }, (_, col) => {
                              const cell = grid.get(`${row},${col}`);
                              if (!cell) {
                                return (
                                  <div key={col} className="h-8 w-8 sm:h-9 sm:w-9" />
                                );
                              }

                              if (cell.type === "aisle" || cell.type === "empty") {
                                return (
                                  <DropCell
                                    key={cell.id}
                                    id={cell.id}
                                    enabled={!readOnly && tool === "move"}
                                    painting={isPainting && tool !== "move"}
                                    onPaintStart={() => {
                                      if (tool !== "move") {
                                        setIsPainting(true);
                                        paintCell(cell);
                                      }
                                    }}
                                    onPaint={() => {
                                      if (tool !== "move") paintCell(cell);
                                    }}
                                  />
                                );
                              }

                              if (cell.type === "blocked") {
                                return (
                                  <SeatBox
                                    key={cell.id}
                                    number="—"
                                    status="unavailable"
                                    title="غیرقابل خرید"
                                    onClick={() => {
                                      if (tool !== "move") paintCell(cell);
                                      setSelectedIds([cell.id]);
                                    }}
                                  />
                                );
                              }

                              const num = seatDisplayNumber(
                                col,
                                normalized.cols,
                                rtl
                              );
                              return (
                                <DraggableSeat
                                  key={cell.id}
                                  cell={cell}
                                  number={num}
                                  selected={selectedIds.includes(cell.id)}
                                  canDrag={!readOnly && tool === "move"}
                                  onSelect={() => setSelectedIds([cell.id])}
                                  onPaint={() => {
                                    if (tool !== "move") {
                                      setIsPainting(true);
                                      paintCell(cell);
                                    }
                                  }}
                                  onPaintEnter={() => {
                                    if (isPainting && tool !== "move") paintCell(cell);
                                  }}
                                />
                              );
                            })}
                          </div>

                          <span className="w-8 shrink-0 text-center text-sm font-black text-neutral-500 sm:w-10">
                            {rowLabel(row, normalized)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <DragOverlay>
                      {dragCell && dragCell.type === "seat" ? (
                        <SeatBox
                          number={seatDisplayNumber(
                            dragCell.col,
                            normalized.cols,
                            rtl
                          )}
                          status="available"
                          dragging
                        />
                      ) : null}
                    </DragOverlay>
                  </DndContext>

                  {normalized.stagePosition === "bottom" ? (
                    <CurvedStageBanner
                      label={normalized.stageLabel || "صحنه اجرا"}
                      position="bottom"
                    />
                  ) : null}
                </>
              )}
            </SeatMapViewport>

            <div className="mt-6 border-t border-neutral-100 pt-5">
              <SeatStatusLegend />
              <p className="mt-3 text-center text-[11px] text-neutral-400">
                {isCanvas
                  ? "Undo: Ctrl+Z · Redo: Ctrl+Y · نشانه ردیف: ابزار Tag روی بوم · Shift+چندتایی"
                  : tool === "move"
                    ? "صندلی را بگیرید و روی خانه خالی یا صندلی دیگر رها کنید."
                    : "با ابزار صندلی/خالی/غیرقابل خرید روی شبکه نقاشی کنید."}
              </p>
            </div>
          </div>
        </main>

        <aside className="hidden w-72 shrink-0 overflow-y-auto border-r border-neutral-200 bg-white p-4 xl:block">
          {selectedMarker && isCanvas ? (
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
              {!readOnly && isCanvas ? (
                <div className="mt-4 space-y-3">
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
                    رو به صحنه (عمود)
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
                      برچسب
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
                <li>صندلی‌ها را آزاد جابه‌جا و با هندل بالایشان بچرخانید.</li>
                <li>
                  ابزار «نشانه ردیف» را بزنید و روی بوم کلیک کنید — یا «نشانه ردیف‌ها از
                  صندلی‌ها».
                </li>
                <li>
                  با <strong>Ctrl+Z</strong> یک قدم برگردید؛ نیازی به ساخت دوباره شبکه
                  نیست.
                </li>
                <li>Shift+کلیک برای انتخاب چندتایی · رنگ بخش برای VIP/بالکن.</li>
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function DropCell({
  id,
  enabled,
  onPaint,
  onPaintStart,
  painting,
}: {
  id: string;
  enabled: boolean;
  onPaint: () => void;
  onPaintStart: () => void;
  painting: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled: !enabled });
  return (
    <div
      ref={setNodeRef}
      onMouseDown={onPaintStart}
      onMouseEnter={() => {
        if (painting) onPaint();
      }}
      className={cn(
        "h-8 w-8 rounded-lg sm:h-9 sm:w-9",
        enabled ? "bg-neutral-50 hover:bg-brand-50" : "bg-transparent",
        isOver && "bg-brand-100 ring-2 ring-brand-400"
      )}
    />
  );
}

function DraggableSeat({
  cell,
  number,
  selected,
  canDrag,
  onSelect,
  onPaint,
  onPaintEnter,
}: {
  cell: SeatCell;
  number: number;
  selected: boolean;
  canDrag: boolean;
  onSelect: () => void;
  onPaint: () => void;
  onPaintEnter: () => void;
}) {
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: cell.id,
    disabled: !canDrag,
  });
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: cell.id,
    disabled: !canDrag,
  });

  return (
    <div
      ref={(node) => {
        setDragRef(node);
        setDropRef(node);
      }}
      {...(canDrag ? { ...listeners, ...attributes } : {})}
      onMouseDown={(e) => {
        if (!canDrag) {
          e.preventDefault();
          onPaint();
        }
      }}
      onMouseEnter={onPaintEnter}
      onClick={onSelect}
    >
      <SeatBox
        number={number}
        status={cell.available ? "available" : "unavailable"}
        selected={selected}
        dragging={isDragging}
        dropTarget={isOver}
        title={`${cell.label} — ${cell.priceLabel}`}
        draggable={canDrag}
      />
    </div>
  );
}
