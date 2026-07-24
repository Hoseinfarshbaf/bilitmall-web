"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 1.75;
const ZOOM_STEP = 0.1;
/** Default map zoom (65%). */
const DEFAULT_ZOOM = 0.65;
/** Padding so both board edges stay reachable when zoomed in. */
const EDGE_PAD = 64;

/** Put this on the seat grid so wheel zoom only applies there. */
export const SEAT_ZOOM_ATTR = "data-seat-zoom";

type SeatMapViewportProps = {
  children: ReactNode;
  className?: string;
  /** Show zoom toolbar (default true). */
  controls?: boolean;
};

/**
 * Seat map viewport with default 65% zoom.
 * Uses transform:scale + explicit shell size (not CSS zoom / flex-center)
 * so when zoomed in, BOTH left and right edges of the dotted board
 * remain reachable via scroll / drag-pan.
 */
export function SeatMapViewport({
  children,
  className,
  controls = true,
}: SeatMapViewportProps) {
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [spaceDown, setSpaceDown] = useState(false);
  const [panning, setPanning] = useState(false);
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [pad, setPad] = useState({ x: EDGE_PAD, y: EDGE_PAD });
  const viewportRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const panRef = useRef<{
    x: number;
    y: number;
    scrollLeft: number;
    scrollTop: number;
  } | null>(null);

  const clamp = useCallback((value: number) => {
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(value * 100) / 100));
  }, []);

  const measureNatural = useCallback(() => {
    const el = measureRef.current;
    if (!el) return { w: 0, h: 0 };
    // Unscaled layout size (transform does not affect offset*).
    return { w: el.offsetWidth, h: el.offsetHeight };
  }, []);

  const updatePadAndMaybeCenter = useCallback(
    (center: boolean, size = natural, nextZoom = zoom) => {
      const vp = viewportRef.current;
      if (!vp || size.w <= 0 || size.h <= 0) return;

      const scaledW = size.w * nextZoom;
      const scaledH = size.h * nextZoom;
      const viewW = vp.clientWidth;
      const viewH = vp.clientHeight;

      const nextPad = {
        x: Math.max(EDGE_PAD, Math.floor((viewW - scaledW) / 2)),
        y: Math.max(EDGE_PAD, Math.floor((viewH - scaledH) / 2)),
      };
      setPad(nextPad);

      if (center) {
        requestAnimationFrame(() => {
          const maxX = Math.max(0, vp.scrollWidth - vp.clientWidth);
          const maxY = Math.max(0, vp.scrollHeight - vp.clientHeight);
          vp.scrollLeft = maxX / 2;
          vp.scrollTop = maxY / 2;
        });
      }
    },
    [natural, zoom]
  );

  const zoomIn = useCallback(() => {
    setZoom((z) => clamp(z + ZOOM_STEP));
  }, [clamp]);

  const zoomOut = useCallback(() => {
    setZoom((z) => clamp(z - ZOOM_STEP));
  }, [clamp]);

  const resetZoom = useCallback(() => {
    setZoom(DEFAULT_ZOOM);
    requestAnimationFrame(() => {
      const size = measureNatural();
      setNatural(size);
      updatePadAndMaybeCenter(true, size, DEFAULT_ZOOM);
    });
  }, [measureNatural, updatePadAndMaybeCenter]);

  useLayoutEffect(() => {
    const size = measureNatural();
    setNatural(size);
    updatePadAndMaybeCenter(true, size, zoom);
    // Mount only — re-measure via ResizeObserver below.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional mount center
  }, []);

  useLayoutEffect(() => {
    updatePadAndMaybeCenter(false);
  }, [zoom, natural.w, natural.h, updatePadAndMaybeCenter]);

  useEffect(() => {
    const vp = viewportRef.current;
    const measure = measureRef.current;
    if (!vp || !measure || typeof ResizeObserver === "undefined") return;

    const ro = new ResizeObserver(() => {
      const size = measureNatural();
      setNatural(size);
      updatePadAndMaybeCenter(Math.abs(zoom - DEFAULT_ZOOM) < 0.001, size, zoom);
    });
    ro.observe(vp);
    ro.observe(measure);
    return () => ro.disconnect();
  }, [measureNatural, updatePadAndMaybeCenter, zoom]);

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

  useEffect(() => {
    function isTyping(target: EventTarget | null) {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target.isContentEditable
      );
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.code !== "Space" || isTyping(e.target)) return;
      e.preventDefault();
      setSpaceDown(true);
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.code !== "Space") return;
      setSpaceDown(false);
      setPanning(false);
      panRef.current = null;
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  function canStartPan(e: React.PointerEvent, target: EventTarget | null) {
    if (e.button === 1) return true;
    if (spaceDown && e.button === 0) return true;
    if (e.button !== 0) return false;
    if (!(target instanceof Element)) return false;
    if (
      target.closest(
        "[data-seat-box], [data-row-marker], [data-stage], [data-canvas-draggable]"
      )
    ) {
      return false;
    }
    return Boolean(
      target.closest(`[${SEAT_ZOOM_ATTR}]`) || target === e.currentTarget
    );
  }

  function onPointerDown(e: React.PointerEvent) {
    const el = viewportRef.current;
    if (!el || !canStartPan(e, e.target)) return;

    panRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: el.scrollLeft,
      scrollTop: el.scrollTop,
    };
    setPanning(true);
    el.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    const el = viewportRef.current;
    const pan = panRef.current;
    if (!el || !pan) return;
    el.scrollLeft = pan.scrollLeft - (e.clientX - pan.x);
    el.scrollTop = pan.scrollTop - (e.clientY - pan.y);
  }

  function onPointerUp(e: React.PointerEvent) {
    panRef.current = null;
    setPanning(false);
    const el = viewportRef.current;
    try {
      el?.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }

  const percent = Math.round(zoom * 100);
  const shellW = natural.w > 0 ? natural.w * zoom : undefined;
  const shellH = natural.h > 0 ? natural.h * zoom : undefined;

  return (
    <div className={cn("relative", className)}>
      {controls ? (
        <div className="mb-3 flex items-center justify-end gap-1.5">
          <span className="me-auto text-[11px] font-bold text-neutral-400">
            زوم {percent.toLocaleString("fa-IR")}٪ · پیش‌فرض ۶۵٪ · اسکرول روی بوم = زوم ·
            درگ خالی = جابه‌جایی نما
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
            title="بازنشانی زوم ۶۵٪"
            aria-label="بازنشانی زوم ۶۵٪"
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
        dir="ltr"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={cn(
          "max-h-[min(70vh,720px)] overflow-auto rounded-2xl bg-neutral-50/80",
          (spaceDown || panning) && "cursor-grab",
          panning && "cursor-grabbing select-none"
        )}
      >
        <div
          className="box-border w-max"
          style={{
            paddingLeft: pad.x,
            paddingRight: pad.x,
            paddingTop: pad.y,
            paddingBottom: pad.y,
          }}
        >
          {/* Explicit scaled shell → scrollWidth/Height always include full board. */}
          <div
            className="relative overflow-hidden"
            style={{
              width: shellW,
              height: shellH,
            }}
          >
            <div
              ref={measureRef}
              className="w-max origin-top-left will-change-transform"
              style={{ transform: `scale(${zoom})` }}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
