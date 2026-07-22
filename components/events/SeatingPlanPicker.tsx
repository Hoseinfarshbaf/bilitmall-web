"use client";

import { useMemo } from "react";
import type { SeatCell, SeatSaleStatus, SeatingLayout } from "@/lib/seating/types";
import { normalizeLayout, rowLabel, seatDisplayNumber } from "@/lib/seating/layout";
import {
  CurvedStageBanner,
  SeatBox,
  SeatStatusLegend,
} from "@/components/seating/SeatMapVisuals";
import { SeatMapViewport, SEAT_ZOOM_ATTR } from "@/components/seating/SeatMapViewport";
import FreeformSeatBoard from "@/components/seating/FreeformSeatBoard";

type SeatingPlanPickerProps = {
  layout: SeatingLayout;
  selectedIds: string[];
  onToggleSeat: (seatId: string, cell: SeatCell) => void;
  variant?: "bilitmall" | "organizer";
  occupancy?: Record<string, Exclude<SeatSaleStatus, "available" | "selected">>;
};

function resolveStatus(
  cell: SeatCell,
  selected: boolean,
  occupancy?: SeatingPlanPickerProps["occupancy"]
): SeatSaleStatus {
  if (selected) return "selected";
  const occ = occupancy?.[cell.id];
  if (occ) return occ;
  if (!cell.available || cell.type === "blocked") return "unavailable";
  return "available";
}

export default function SeatingPlanPicker({
  layout,
  selectedIds,
  onToggleSeat,
  occupancy,
}: SeatingPlanPickerProps) {
  const normalized = useMemo(() => normalizeLayout(layout), [layout]);

  const grid = useMemo(() => {
    const map = new Map<string, SeatCell>();
    for (const cell of normalized.cells) map.set(`${cell.row},${cell.col}`, cell);
    return map;
  }, [normalized.cells]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const rtl = normalized.seatNumbersRtl !== false;

  const totalRial = useMemo(() => {
    return normalized.cells
      .filter((c) => selectedSet.has(c.id) && c.type === "seat")
      .reduce((sum, c) => sum + c.priceRial, 0);
  }, [normalized.cells, selectedSet]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-black text-neutral-800 dark:text-white/90">
          {normalized.name}
        </span>
        <span className="text-neutral-500 dark:text-white/60">
          {selectedIds.length > 0
            ? `${selectedIds.length.toLocaleString("fa-IR")} صندلی — ${totalRial.toLocaleString("fa-IR")} تومان`
            : "صندلی مورد نظر را انتخاب کنید"}
        </span>
      </div>

      <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-black/40 sm:p-7">
        <SeatMapViewport>
          {normalized.mode === "canvas" ? (
            <FreeformSeatBoard
              layout={normalized}
              readOnly
              interactive
              purchaseSelectedIds={selectedIds}
              occupancy={occupancy}
              onToggleSeat={onToggleSeat}
            />
          ) : (
            <>
              {normalized.stagePosition !== "bottom" ? (
                <CurvedStageBanner
                  label={normalized.stageLabel || "صحنه اجرا"}
                  position={normalized.stagePosition}
                />
              ) : null}

              <div
                className="flex w-max flex-col items-center gap-1.5"
                {...{ [SEAT_ZOOM_ATTR]: "" }}
              >
                {Array.from({ length: normalized.rows }, (_, row) => (
                  <div key={row} className="flex items-center gap-2 sm:gap-3">
                    <span className="w-8 shrink-0 text-center text-sm font-black text-neutral-500 sm:w-10 dark:text-white/50">
                      {rowLabel(row, normalized)}
                    </span>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: normalized.cols }, (_, col) => {
                        const cell = grid.get(`${row},${col}`);
                        if (!cell) {
                          return <div key={col} className="h-8 w-8 sm:h-9 sm:w-9" />;
                        }
                        if (cell.type === "empty" || cell.type === "aisle") {
                          return <div key={col} className="h-8 w-8 sm:h-9 sm:w-9" />;
                        }

                        const selected = selectedSet.has(cell.id);
                        const status = resolveStatus(cell, selected, occupancy);
                        const selectable =
                          cell.type === "seat" &&
                          (status === "available" || status === "selected");
                        const num =
                          cell.type === "blocked"
                            ? "—"
                            : seatDisplayNumber(col, normalized.cols, rtl);

                        return (
                          <SeatBox
                            key={cell.id}
                            number={num}
                            status={status}
                            selected={selected}
                            fillColor={cell.sectionColor}
                            disabled={!selectable}
                            title={
                              cell.type === "seat"
                                ? `${cell.label} — ${cell.priceLabel}`
                                : undefined
                            }
                            onClick={() => {
                              if (selectable) onToggleSeat(cell.id, cell);
                            }}
                          />
                        );
                      })}
                    </div>

                    <span className="w-8 shrink-0 text-center text-sm font-black text-neutral-500 sm:w-10 dark:text-white/50">
                      {rowLabel(row, normalized)}
                    </span>
                  </div>
                ))}
              </div>

              {normalized.stagePosition === "bottom" ? (
                <CurvedStageBanner
                  label={normalized.stageLabel || "صحنه اجرا"}
                  position="bottom"
                />
              ) : null}
            </>
          )}
        </SeatMapViewport>

        <div className="mt-6 border-t border-neutral-100 pt-5 dark:border-white/10">
          <SeatStatusLegend />
        </div>
      </div>
    </div>
  );
}
