"use client";

import { useMemo } from "react";
import type { SeatCell, SeatingLayout } from "@/lib/seating/types";
import { rowLabel } from "@/lib/seating/layout";

type SeatingPlanPickerProps = {
  layout: SeatingLayout;
  selectedIds: string[];
  onToggleSeat: (seatId: string, cell: SeatCell) => void;
  variant?: "bilitmall" | "organizer";
};

function pickerCellClass(
  cell: SeatCell,
  selected: boolean,
  variant: "bilitmall" | "organizer"
): string {
  const base =
    "flex h-8 w-8 items-center justify-center rounded-md text-[9px] font-bold transition sm:h-9 sm:w-9 sm:text-[10px] ";

  if (cell.type === "stage") return base + "bg-violet-600/90 text-white cursor-default ";
  if (cell.type === "blocked" || cell.type === "aisle" || cell.type === "empty") {
    return base + "bg-transparent cursor-default ";
  }
  if (!cell.available) return base + "bg-white/10 text-white/30 line-through cursor-not-allowed ";
  if (selected) {
    return (
      base +
      (variant === "bilitmall"
        ? "bg-red-500 text-white ring-2 ring-red-300 "
        : "bg-emerald-500 text-white ring-2 ring-emerald-300 ")
    );
  }
  return base + "bg-white/20 text-white hover:bg-white/35 cursor-pointer ";
}

export default function SeatingPlanPicker({
  layout,
  selectedIds,
  onToggleSeat,
  variant = "bilitmall",
}: SeatingPlanPickerProps) {
  const grid = useMemo(() => {
    const map = new Map<string, SeatCell>();
    for (const cell of layout.cells) map.set(`${cell.row},${cell.col}`, cell);
    return map;
  }, [layout.cells]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const totalRial = useMemo(() => {
    return layout.cells
      .filter((c) => selectedSet.has(c.id) && c.type === "seat")
      .reduce((sum, c) => sum + c.priceRial, 0);
  }, [layout.cells, selectedSet]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-bold text-white/90">{layout.name}</span>
        <span className="text-white/60">
          {selectedIds.length > 0
            ? `${selectedIds.length} صندلی — ${totalRial.toLocaleString("fa-IR")} تومان`
            : "صندلی مورد نظر را انتخاب کنید"}
        </span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur">
        {layout.stagePosition === "top" ? (
          <div className="mb-3 rounded-lg bg-violet-600/80 py-2 text-center text-xs font-black text-white">
            {layout.stageLabel || "صحنه"}
          </div>
        ) : null}

        <div className="inline-flex min-w-full flex-col items-center gap-0.5">
          {Array.from({ length: layout.rows }, (_, row) => (
            <div key={row} className="flex items-center gap-1">
              <span className="w-5 shrink-0 text-center text-[10px] font-black text-amber-400/80">
                {rowLabel(row)}
              </span>
              {Array.from({ length: layout.cols }, (_, col) => {
                const cell = grid.get(`${row},${col}`);
                if (!cell) return <div key={col} className="h-8 w-8 sm:h-9 sm:w-9" />;
                if (cell.type === "empty" || cell.type === "aisle") {
                  return <div key={col} className="h-8 w-8 sm:h-9 sm:w-9" />;
                }
                const isSeat = cell.type === "seat";
                return (
                  <button
                    key={cell.id}
                    type="button"
                    disabled={!isSeat || !cell.available}
                    title={isSeat ? `${cell.label} — ${cell.priceLabel}` : undefined}
                    onClick={() => isSeat && cell.available && onToggleSeat(cell.id, cell)}
                    className={pickerCellClass(cell, selectedSet.has(cell.id), variant)}
                  >
                    {cell.type === "stage"
                      ? "🎭"
                      : cell.type === "blocked"
                        ? "✕"
                        : isSeat
                          ? String(col + 1)
                          : ""}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {layout.stagePosition === "bottom" ? (
          <div className="mt-3 rounded-lg bg-violet-600/80 py-2 text-center text-xs font-black text-white">
            {layout.stageLabel || "صحنه"}
          </div>
        ) : null}
      </div>

      <p className="text-xs text-white/50">
        روی صندلی‌های سبز/خاکستری کلیک کنید. صندلی‌های خط‌خورده رزرو شده‌اند.
      </p>
    </div>
  );
}
