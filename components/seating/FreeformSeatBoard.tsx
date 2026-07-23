"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CanvasRowMarker,
  SeatCell,
  SeatSaleStatus,
  SeatingLayout,
} from "@/lib/seating/types";
import {
  CANVAS_GRID_SIZE,
  CANVAS_SEAT_SIZE,
  placedSeats,
  resolveSeatDisplay,
  resolveStagePlacement,
} from "@/lib/seating/layout";
import {
  SeatBox,
  SemicircleStage,
} from "@/components/seating/SeatMapVisuals";
import { SEAT_ZOOM_ATTR } from "@/components/seating/SeatMapViewport";
import { cn } from "@/lib/utils";
import { RotateCw } from "lucide-react";

export type FreeformTool =
  | "move"
  | "seat"
  | "blocked"
  | "erase"
  | "rotate"
  | "label";

type FreeformSeatBoardProps = {
  layout: SeatingLayout;
  selectedIds?: string[];
  selectedMarkerId?: string | null;
  /** When set, this row is active for group edit (highlight + drag together). */
  selectedRowIndex?: number | null;
  readOnly?: boolean;
  interactive?: boolean;
  tool?: FreeformTool;
  /** When onSelectRow is set: double-click / Alt+click selects whole row; single click selects one seat. */
  enableRowSelection?: boolean;
  occupancy?: Record<string, Exclude<SeatSaleStatus, "available" | "selected">>;
  purchaseSelectedIds?: string[];
  onSelectSeats?: (ids: string[]) => void;
  onSelectRow?: (rowIndex: number | null) => void;
  onSelectMarker?: (id: string | null) => void;
  onMoveSeats?: (moves: { id: string; x: number; y: number }[]) => void;
  onRotateSeats?: (ids: string[], rotation: number, mode: "absolute" | "delta") => void;
  onAddSeat?: (x: number, y: number, type: "seat" | "blocked") => void;
  onEraseSeats?: (ids: string[]) => void;
  onAddRowMarker?: (x: number, y: number) => void;
  onMoveRowMarker?: (id: string, x: number, y: number) => void;
  onEraseMarkers?: (ids: string[]) => void;
  onMoveStage?: (x: number, y: number) => void;
  onSelectStage?: () => void;
  onGestureEnd?: () => void;
  onToggleSeat?: (seatId: string, cell: SeatCell) => void;
};

function resolveStatus(
  cell: SeatCell,
  selected: boolean,
  occupancy?: FreeformSeatBoardProps["occupancy"]
): SeatSaleStatus {
  if (selected) return "selected";
  const occ = occupancy?.[cell.id];
  if (occ) return occ;
  if (cell.type === "blocked" || !cell.available) return "unavailable";
  return "available";
}

export default function FreeformSeatBoard({
  layout,
  selectedIds = [],
  selectedMarkerId = null,
  selectedRowIndex = null,
  readOnly = false,
  interactive = true,
  tool = "move",
  enableRowSelection = false,
  occupancy,
  purchaseSelectedIds = [],
  onSelectSeats,
  onSelectRow,
  onSelectMarker,
  onMoveSeats,
  onRotateSeats,
  onAddSeat,
  onEraseSeats,
  onAddRowMarker,
  onMoveRowMarker,
  onEraseMarkers,
  onMoveStage,
  onSelectStage,
  onGestureEnd,
  onToggleSeat,
}: FreeformSeatBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [draggingIds, setDraggingIds] = useState<string[]>([]);
  const [draggingMarkerId, setDraggingMarkerId] = useState<string | null>(null);
  const [draggingStage, setDraggingStage] = useState(false);
  const [rotating, setRotating] = useState(false);
  const dragOrigin = useRef<{ x: number; y: number } | null>(null);
  const seatOrigins = useRef<Map<string, { x: number; y: number }>>(new Map());
  const markerOrigin = useRef<{ x: number; y: number } | null>(null);
  const stageOrigin = useRef<{ x: number; y: number } | null>(null);
  const rotateStart = useRef<{ angle: number; base: number } | null>(null);
  const didDrag = useRef(false);
  /** Seat id waiting for click-without-drag to leave row mode. */
  const pendingRowDrillId = useRef<string | null>(null);

  const width = layout.canvasWidth ?? 960;
  const height = layout.canvasHeight ?? 720;
  const gridSize = layout.gridSize ?? CANVAS_GRID_SIZE;
  const seats = placedSeats(layout);
  const markers = layout.rowMarkers ?? [];
  const stage = resolveStagePlacement(layout);
  const selectedSet = new Set(selectedIds);
  const purchaseSet = new Set(purchaseSelectedIds);

  const dotBg = {
    backgroundColor: "#f7f7f8",
    backgroundImage: `radial-gradient(circle, #bdbdbd 1.1px, transparent 1.1px)`,
    backgroundSize: `${gridSize}px ${gridSize}px`,
  };

  const clientToBoard = useCallback((clientX: number, clientY: number) => {
    const el = boardRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    const scaleX = rect.width / el.offsetWidth || 1;
    const scaleY = rect.height / el.offsetHeight || 1;
    return {
      x: (clientX - rect.left) / scaleX,
      y: (clientY - rect.top) / scaleY,
    };
  }, []);

  const primarySelected =
    seats.find((s) => selectedSet.has(s.id)) ??
    (selectedIds[0] ? seats.find((s) => s.id === selectedIds[0]) : null);

  useEffect(() => {
    if (readOnly) return;
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (selectedMarkerId && (e.key === "Delete" || e.key === "Backspace")) {
        e.preventDefault();
        onEraseMarkers?.([selectedMarkerId]);
        return;
      }

      if (!selectedIds.length) return;

      if (e.key === "[" || e.key === "]") {
        e.preventDefault();
        const delta = e.key === "]" ? 5 : -5;
        onRotateSeats?.(selectedIds, delta, "delta");
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        onEraseSeats?.(selectedIds);
      }
      if (e.key === "Escape") {
        onSelectSeats?.([]);
        onSelectMarker?.(null);
        onSelectRow?.(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    readOnly,
    selectedIds,
    selectedMarkerId,
    onRotateSeats,
    onEraseSeats,
    onEraseMarkers,
    onSelectSeats,
    onSelectMarker,
    onSelectRow,
  ]);

  function endGesture() {
    if (didDrag.current) onGestureEnd?.();
    didDrag.current = false;
  }

  function onBoardPointerDown(e: React.PointerEvent) {
    if (readOnly || !interactive) return;
    if (e.target !== e.currentTarget && !(e.target as HTMLElement).dataset?.boardHit) {
      return;
    }
    if (tool === "seat" || tool === "blocked") {
      const { x, y } = clientToBoard(e.clientX, e.clientY);
      onAddSeat?.(
        x - CANVAS_SEAT_SIZE / 2,
        y - CANVAS_SEAT_SIZE / 2,
        tool === "blocked" ? "blocked" : "seat"
      );
    } else if (tool === "label") {
      const { x, y } = clientToBoard(e.clientX, e.clientY);
      onAddRowMarker?.(x - 16, y - 16);
    } else {
      onSelectSeats?.([]);
      onSelectMarker?.(null);
      onSelectRow?.(null);
    }
  }

  function rowSeatIds(rowIndex: number) {
    return seats.filter((s) => s.row === rowIndex).map((s) => s.id);
  }

  function selectSeat(cell: SeatCell, additive: boolean) {
    onSelectMarker?.(null);

    if (additive) {
      onSelectRow?.(null);
      if (selectedSet.has(cell.id)) {
        onSelectSeats?.(selectedIds.filter((id) => id !== cell.id));
      } else {
        onSelectSeats?.([...selectedIds, cell.id]);
      }
      return;
    }

    onSelectRow?.(null);
    onSelectSeats?.([cell.id]);
  }

  function selectWholeRow(rowIndex: number) {
    onSelectMarker?.(null);
    const ids = rowSeatIds(rowIndex);
    onSelectRow?.(rowIndex);
    onSelectSeats?.(ids);
  }

  function onSeatPointerDown(e: React.PointerEvent, cell: SeatCell) {
    e.stopPropagation();
    if (!interactive) return;
    if (readOnly) return;

    if (tool === "erase") {
      onEraseSeats?.([cell.id]);
      return;
    }
    if (tool === "label") return;

    const additive = e.shiftKey || e.metaKey || e.ctrlKey;
    const wantWholeRow =
      enableRowSelection &&
      !additive &&
      (e.detail >= 2 || e.altKey);
    const keepRowDrag =
      enableRowSelection &&
      !additive &&
      !wantWholeRow &&
      selectedRowIndex === cell.row;

    let dragIds: string[];

    if (wantWholeRow) {
      pendingRowDrillId.current = null;
      selectWholeRow(cell.row);
      dragIds = rowSeatIds(cell.row);
    } else if (keepRowDrag) {
      // Row already selected — drag the whole row; drill-in happens on click without drag.
      pendingRowDrillId.current = cell.id;
      dragIds = rowSeatIds(cell.row);
    } else if (additive) {
      pendingRowDrillId.current = null;
      selectSeat(cell, true);
      dragIds = selectedSet.has(cell.id)
        ? selectedIds.filter((id) => id !== cell.id)
        : [...selectedIds, cell.id];
      if (!dragIds.length) dragIds = [cell.id];
    } else if (!additive && selectedSet.has(cell.id) && selectedIds.length > 1) {
      pendingRowDrillId.current = null;
      // Keep multi-selection and drag all selected seats together.
      dragIds = selectedIds;
    } else {
      pendingRowDrillId.current = null;
      selectSeat(cell, false);
      dragIds = [cell.id];
    }

    if (tool === "rotate") {
      const { x, y } = clientToBoard(e.clientX, e.clientY);
      const cx = (cell.x ?? 0) + CANVAS_SEAT_SIZE / 2;
      const cy = (cell.y ?? 0) + CANVAS_SEAT_SIZE / 2;
      const angle = (Math.atan2(y - cy, x - cx) * 180) / Math.PI;
      rotateStart.current = { angle, base: cell.rotation ?? 0 };
      setRotating(true);
      didDrag.current = false;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }

    if (tool !== "move" && tool !== "seat") return;

    const { x, y } = clientToBoard(e.clientX, e.clientY);
    dragOrigin.current = { x, y };
    const origins = new Map<string, { x: number; y: number }>();
    const group = seats.filter((s) => dragIds.includes(s.id));
    const groupIds = group.map((s) => s.id);
    for (const s of group) {
      origins.set(s.id, { x: s.x ?? 0, y: s.y ?? 0 });
    }
    seatOrigins.current = origins;
    didDrag.current = false;
    setDraggingIds(groupIds);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onSeatPointerMove(e: React.PointerEvent, cell: SeatCell) {
    if (readOnly) return;
    const pos = clientToBoard(e.clientX, e.clientY);

    if (rotating && rotateStart.current) {
      didDrag.current = true;
      pendingRowDrillId.current = null;
      const cx = (cell.x ?? 0) + CANVAS_SEAT_SIZE / 2;
      const cy = (cell.y ?? 0) + CANVAS_SEAT_SIZE / 2;
      const angle = (Math.atan2(pos.y - cy, pos.x - cx) * 180) / Math.PI;
      const delta = angle - rotateStart.current.angle;
      const ids = selectedIds.includes(cell.id) ? selectedIds : [cell.id];
      onRotateSeats?.(ids, rotateStart.current.base + delta, "absolute");
      return;
    }

    if (!draggingIds.length || !dragOrigin.current) return;
    didDrag.current = true;
    pendingRowDrillId.current = null;
    const dx = pos.x - dragOrigin.current.x;
    const dy = pos.y - dragOrigin.current.y;
    const moves = draggingIds.map((id) => {
      const o = seatOrigins.current.get(id) ?? { x: 0, y: 0 };
      return { id, x: o.x + dx, y: o.y + dy };
    });
    onMoveSeats?.(moves);
  }

  function onSeatPointerUp(e: React.PointerEvent, cell: SeatCell) {
    const drilled =
      enableRowSelection &&
      !didDrag.current &&
      pendingRowDrillId.current === cell.id;

    pendingRowDrillId.current = null;
    setDraggingIds([]);
    setRotating(false);
    dragOrigin.current = null;
    rotateStart.current = null;
    endGesture();
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }

    // Click (no drag) on a seat inside an active row → edit that seat alone.
    if (drilled) {
      onSelectMarker?.(null);
      onSelectRow?.(null);
      onSelectSeats?.([cell.id]);
    }
  }

  function onRotateHandleDown(e: React.PointerEvent, cell: SeatCell) {
    e.stopPropagation();
    if (readOnly) return;
    pendingRowDrillId.current = null;
    onSelectSeats?.(selectedIds.includes(cell.id) ? selectedIds : [cell.id]);
    const { x, y } = clientToBoard(e.clientX, e.clientY);
    const cx = (cell.x ?? 0) + CANVAS_SEAT_SIZE / 2;
    const cy = (cell.y ?? 0) + CANVAS_SEAT_SIZE / 2;
    const angle = (Math.atan2(y - cy, x - cx) * 180) / Math.PI;
    rotateStart.current = { angle, base: cell.rotation ?? 0 };
    setRotating(true);
    didDrag.current = false;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onRotateHandleMove(e: React.PointerEvent, cell: SeatCell) {
    if (!rotating || !rotateStart.current) return;
    didDrag.current = true;
    const pos = clientToBoard(e.clientX, e.clientY);
    const cx = (cell.x ?? 0) + CANVAS_SEAT_SIZE / 2;
    const cy = (cell.y ?? 0) + CANVAS_SEAT_SIZE / 2;
    const angle = (Math.atan2(pos.y - cy, pos.x - cx) * 180) / Math.PI;
    const delta = angle - rotateStart.current.angle;
    const ids = selectedIds.includes(cell.id) ? selectedIds : [cell.id];
    onRotateSeats?.(ids, rotateStart.current.base + delta, "absolute");
  }

  function onMarkerPointerDown(e: React.PointerEvent, marker: CanvasRowMarker) {
    e.stopPropagation();
    if (!interactive || readOnly) return;

    if (tool === "erase") {
      onEraseMarkers?.([marker.id]);
      return;
    }

    onSelectSeats?.([]);
    onSelectMarker?.(marker.id);

    if (tool !== "move" && tool !== "label") return;

    const { x, y } = clientToBoard(e.clientX, e.clientY);
    dragOrigin.current = { x, y };
    markerOrigin.current = { x: marker.x, y: marker.y };
    didDrag.current = false;
    setDraggingMarkerId(marker.id);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onMarkerPointerMove(e: React.PointerEvent) {
    if (!draggingMarkerId || !dragOrigin.current || !markerOrigin.current) return;
    didDrag.current = true;
    const pos = clientToBoard(e.clientX, e.clientY);
    onMoveRowMarker?.(
      draggingMarkerId,
      markerOrigin.current.x + (pos.x - dragOrigin.current.x),
      markerOrigin.current.y + (pos.y - dragOrigin.current.y)
    );
  }

  function onMarkerPointerUp(e: React.PointerEvent) {
    setDraggingMarkerId(null);
    dragOrigin.current = null;
    markerOrigin.current = null;
    endGesture();
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }

  function onStagePointerDown(e: React.PointerEvent) {
    e.stopPropagation();
    if (!interactive || readOnly || !onMoveStage) return;
    onSelectStage?.();
    onSelectSeats?.([]);
    onSelectMarker?.(null);
    onSelectRow?.(null);
    const { x, y } = clientToBoard(e.clientX, e.clientY);
    dragOrigin.current = { x, y };
    stageOrigin.current = { x: stage.stageX, y: stage.stageY };
    didDrag.current = false;
    setDraggingStage(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onStagePointerMove(e: React.PointerEvent) {
    if (!draggingStage || !dragOrigin.current || !stageOrigin.current) return;
    didDrag.current = true;
    const pos = clientToBoard(e.clientX, e.clientY);
    onMoveStage?.(
      stageOrigin.current.x + (pos.x - dragOrigin.current.x),
      stageOrigin.current.y + (pos.y - dragOrigin.current.y)
    );
  }

  function onStagePointerUp(e: React.PointerEvent) {
    setDraggingStage(false);
    dragOrigin.current = null;
    stageOrigin.current = null;
    endGesture();
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="flex w-max flex-col items-center" {...{ [SEAT_ZOOM_ATTR]: "" }}>
      <div
        ref={boardRef}
        data-board-hit="1"
        onPointerDown={onBoardPointerDown}
        className={cn(
          "relative rounded-2xl border border-neutral-200 shadow-inner",
          !readOnly &&
            (tool === "seat" || tool === "blocked" || tool === "label") &&
            "cursor-crosshair",
          !readOnly && tool === "rotate" && "cursor-alias"
        )}
        style={{
          width,
          height,
          ...dotBg,
        }}
      >
        <div data-board-hit="1" className="absolute inset-0" />

        <SemicircleStage
          label={layout.stageLabel || "صحنه اجرا"}
          x={stage.stageX}
          y={stage.stageY}
          width={stage.stageWidth}
          height={stage.stageHeight}
          draggable={!readOnly && Boolean(onMoveStage)}
          selected={draggingStage}
          onPointerDown={onStagePointerDown}
          onPointerMove={onStagePointerMove}
          onPointerUp={onStagePointerUp}
        />

        {markers.map((marker) => {
          const active = selectedMarkerId === marker.id;
          return (
            <div
              key={marker.id}
              className={cn(
                "absolute z-10 flex h-8 w-8 touch-none items-center justify-center rounded-full border-2 text-xs font-black shadow-sm",
                active
                  ? "border-brand-500 bg-brand-500 text-white"
                  : "border-neutral-700 bg-white text-neutral-800",
                !readOnly && tool === "move" && "cursor-grab active:cursor-grabbing",
                draggingMarkerId === marker.id && "opacity-80"
              )}
              style={{ left: marker.x, top: marker.y }}
              title={`ردیف ${marker.label}`}
              onPointerDown={(e) => onMarkerPointerDown(e, marker)}
              onPointerMove={onMarkerPointerMove}
              onPointerUp={onMarkerPointerUp}
            >
              {marker.label}
            </div>
          );
        })}

        {seats.map((cell) => {
          const studioSelected =
            selectedSet.has(cell.id) || selectedRowIndex === cell.row;
          const purchaseSelected = purchaseSet.has(cell.id);
          const status = resolveStatus(cell, purchaseSelected, occupancy);
          const num = resolveSeatDisplay(cell, layout);

          const selectable =
            Boolean(onToggleSeat) &&
            cell.type === "seat" &&
            (status === "available" || status === "selected");

          const rotation = cell.rotation ?? 0;

          return (
            <div
              key={cell.id}
              className={cn(
                "absolute touch-none",
                draggingIds.includes(cell.id) && "z-20",
                studioSelected && "z-10"
              )}
              style={{
                left: cell.x ?? 0,
                top: cell.y ?? 0,
                width: CANVAS_SEAT_SIZE,
                height: CANVAS_SEAT_SIZE,
              }}
              onPointerDown={(e) => onSeatPointerDown(e, cell)}
              onPointerMove={(e) => onSeatPointerMove(e, cell)}
              onPointerUp={(e) => onSeatPointerUp(e, cell)}
            >
              <div
                className={cn(
                  "h-full w-full",
                  !readOnly && tool === "move" && "cursor-grab active:cursor-grabbing"
                )}
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transformOrigin: "center center",
                }}
              >
                <SeatBox
                  number={num}
                  status={status}
                  selected={studioSelected || purchaseSelected}
                  fillColor={cell.sectionColor}
                  disabled={Boolean(onToggleSeat) && !selectable}
                  dragging={draggingIds.includes(cell.id)}
                  draggable={!readOnly && tool === "move"}
                  title={`${cell.label}${rotation ? ` · ${Math.round(rotation)}°` : ""}${cell.priceLabel ? ` — ${cell.priceLabel}` : ""}`}
                  className="h-full w-full"
                  /* Keep digits readable for the viewer even if the seat box is angled */
                  style={{ transform: `rotate(${-rotation}deg)` }}
                  onClick={() => {
                    if (selectable) onToggleSeat?.(cell.id, cell);
                  }}
                />
              </div>

              {!readOnly &&
              studioSelected &&
              primarySelected?.id === cell.id &&
              (tool === "move" || tool === "rotate") ? (
                <button
                  type="button"
                  className="absolute -top-8 left-1/2 z-30 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border-2 border-brand-500 bg-white text-brand-600 shadow-md"
                  title="چرخش — بکشید · کلید [ ]"
                  onPointerDown={(e) => onRotateHandleDown(e, cell)}
                  onPointerMove={(e) => onRotateHandleMove(e, cell)}
                  onPointerUp={(e) => onSeatPointerUp(e, cell)}
                >
                  <RotateCw className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
