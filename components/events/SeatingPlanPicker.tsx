"use client";

import { useMemo, useState } from "react";
import { Box, Map } from "lucide-react";
import type { SeatCell, SeatSaleStatus, SeatingLayout } from "@/lib/seating/types";
import { normalizeLayout } from "@/lib/seating/layout";
import { SeatStatusLegend } from "@/components/seating/SeatMapVisuals";
import { SeatMapViewport } from "@/components/seating/SeatMapViewport";
import FreeformSeatBoard from "@/components/seating/FreeformSeatBoard";
import SeatingHall3DLazy from "@/components/seating/SeatingHall3DLazy";
import { cn } from "@/lib/utils";

type SeatingPlanPickerProps = {
  layout: SeatingLayout;
  selectedIds: string[];
  onToggleSeat: (seatId: string, cell: SeatCell) => void;
  variant?: "bilitmall" | "organizer";
  occupancy?: Record<string, Exclude<SeatSaleStatus, "available" | "selected">>;
};

type ViewMode = "map" | "3d";

export default function SeatingPlanPicker({
  layout,
  selectedIds,
  onToggleSeat,
  occupancy,
}: SeatingPlanPickerProps) {
  const normalized = useMemo(() => normalizeLayout(layout), [layout]);
  const [viewMode, setViewMode] = useState<ViewMode>("map");

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

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
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-neutral-200 bg-neutral-50 p-0.5 dark:border-white/10 dark:bg-white/5">
            <button
              type="button"
              onClick={() => setViewMode("map")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black transition",
                viewMode === "map"
                  ? "bg-white text-neutral-900 shadow-sm dark:bg-white/15 dark:text-white"
                  : "text-neutral-500 hover:text-neutral-800 dark:text-white/50"
              )}
            >
              <Map className="h-3.5 w-3.5" />
              نقشه
            </button>
            <button
              type="button"
              onClick={() => setViewMode("3d")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black transition",
                viewMode === "3d"
                  ? "bg-white text-neutral-900 shadow-sm dark:bg-white/15 dark:text-white"
                  : "text-neutral-500 hover:text-neutral-800 dark:text-white/50"
              )}
            >
              <Box className="h-3.5 w-3.5" />
              سه‌بعدی
            </button>
          </div>
          <span className="text-neutral-500 dark:text-white/60">
            {selectedIds.length > 0
              ? `${selectedIds.length.toLocaleString("fa-IR")} صندلی — ${totalRial.toLocaleString("en-US")} تومان`
              : "صندلی مورد نظر را انتخاب کنید"}
          </span>
        </div>
      </div>

      <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-black/40 sm:p-7">
        {viewMode === "3d" ? (
          <SeatingHall3DLazy
            layout={normalized}
            selectedIds={selectedIds}
            occupancy={occupancy}
            onToggleSeat={onToggleSeat}
          />
        ) : (
          <SeatMapViewport>
            <FreeformSeatBoard
              layout={normalized}
              readOnly
              interactive
              purchaseSelectedIds={selectedIds}
              occupancy={occupancy}
              onToggleSeat={onToggleSeat}
            />
          </SeatMapViewport>
        )}

        <div className="mt-6 border-t border-neutral-100 pt-5 dark:border-white/10">
          <SeatStatusLegend />
          {viewMode === "3d" ? (
            <p className="mt-3 text-center text-[11px] text-neutral-400">
              در حالت سه‌بعدی می‌توانید سالن را بچرخانید و از زاویه هر صندلی صحنه را ببینید.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
