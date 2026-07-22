"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";

const MIN_ZOOM = 0.35;
const MAX_ZOOM = 1.75;
const ZOOM_STEP = 0.1;

/** Put this on the seat grid so wheel zoom only applies there. */
export const SEAT_ZOOM_ATTR = "data-seat-zoom";

type SeatMapViewportProps = {
  children: ReactNode;
  className?: string;
  /** Show zoom toolbar (default true). */
  controls?: boolean;
};

/**
 * Uses CSS `zoom` so the map actually shrinks in layout (not just visually),
 * stays centered, and never clips seats on the sides when zooming out.
 */
export function SeatMapViewport({
  children,
  className,
  controls = true,
}: SeatMapViewportProps) {
  const [zoom, setZoom] = useState(1);
  const viewportRef = useRef<HTMLDivElement>(null);

  const clamp = useCallback((value: number) => {
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(value * 100) / 100));
  }, []);

  const zoomIn = useCallback(() => {
    setZoom((z) => clamp(z + ZOOM_STEP));
  }, [clamp]);

  const zoomOut = useCallback(() => {
    setZoom((z) => clamp(z - ZOOM_STEP));
  }, [clamp]);

  const resetZoom = useCallback(() => setZoom(1), []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    function onWheel(e: WheelEvent) {
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (!target.closest(`[${SEAT_ZOOM_ATTR}]`)) return;

      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      setZoom((z) => clamp(z + delta));
    }

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [clamp]);

  const percent = Math.round(zoom * 100);

  return (
    <div className={cn("relative", className)}>
      {controls ? (
        <div className="mb-3 flex items-center justify-end gap-1.5">
          <span className="me-auto text-[11px] font-bold text-neutral-400">
            زوم {percent.toLocaleString("fa-IR")}٪ · اسکرول روی صندلی‌ها
          </span>
          <button
            type="button"
            onClick={zoomOut}
            disabled={zoom <= MIN_ZOOM}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
            title="کوچک‌نمایی"
            aria-label="کوچک‌نمایی"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={resetZoom}
            className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white px-2 text-[11px] font-black text-neutral-600 hover:bg-neutral-50"
            title="بازنشانی زوم"
            aria-label="بازنشانی زوم"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={zoomIn}
            disabled={zoom >= MAX_ZOOM}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
            title="بزرگ‌نمایی"
            aria-label="بزرگ‌نمایی"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <div
        ref={viewportRef}
        className="max-h-[min(70vh,720px)] overflow-auto rounded-2xl bg-neutral-50/80 p-4"
      >
        <div className="flex w-full justify-center">
          <div
            className="w-max max-w-none"
            style={{ zoom }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
