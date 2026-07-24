import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { cn } from "@/lib/utils";
import type { SeatSaleStatus } from "@/lib/seating/types";

/** HonarTicket-inspired seat status palette (available uses brand soft purple). */
export const SEAT_STATUS_STYLES: Record<
  SeatSaleStatus,
  { box: string; label: string; swatch: string }
> = {
  available: {
    label: "آزاد",
    box: "bg-[#c4b5fd] text-white shadow-sm hover:bg-[#a78bfa]",
    swatch: "bg-[#c4b5fd]",
  },
  selected: {
    label: "انتخاب شما",
    box: "bg-emerald-500 text-white shadow-sm ring-2 ring-emerald-300",
    swatch: "bg-emerald-500",
  },
  sold: {
    label: "خریداری شده",
    box: "bg-red-500 text-white cursor-not-allowed",
    swatch: "bg-red-500",
  },
  pending: {
    label: "منتظر پرداخت",
    box: "bg-amber-400 text-white cursor-not-allowed",
    swatch: "bg-amber-400",
  },
  unavailable: {
    label: "غیرقابل خرید",
    box: "bg-neutral-800 text-white/80 cursor-not-allowed",
    swatch: "bg-neutral-800",
  },
};

export function SeatStatusLegend({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const items: SeatSaleStatus[] = [
    "available",
    "selected",
    "sold",
    "pending",
    "unavailable",
  ];
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-5 gap-y-2",
        className
      )}
    >
      {items.map((status) => (
        <div key={status} className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-md",
              compact ? "h-3.5 w-3.5" : "h-4 w-4",
              SEAT_STATUS_STYLES[status].swatch
            )}
          />
          <span className="text-xs font-bold text-neutral-600">
            {SEAT_STATUS_STYLES[status].label}
          </span>
        </div>
      ))}
    </div>
  );
}

export function CurvedStageBanner({
  label = "صحنه اجرا",
  position = "top",
}: {
  label?: string;
  position?: "top" | "bottom" | "left" | "right";
}) {
  const isBottom = position === "bottom";
  const isSide = position === "left" || position === "right";

  if (isSide) {
    return (
      <div
        className={cn(
          "mb-4 flex items-center gap-2",
          position === "left" ? "justify-start" : "justify-end"
        )}
      >
        <p className="rounded-full bg-sky-50 px-4 py-1.5 text-sm font-black tracking-wide text-sky-600">
          {label}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex w-full flex-col items-center",
        isBottom ? "mt-6 mb-1 flex-col-reverse" : "mb-6 pt-2"
      )}
    >
      <svg
        viewBox="0 0 400 36"
        className={cn(
          "h-8 w-full min-w-[12rem] text-sky-500",
          isBottom && "rotate-180"
        )}
        aria-hidden
      >
        <path
          d="M20 28 Q200 0 380 28"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <p
        className={cn(
          "text-sm font-black tracking-wide text-sky-600",
          isBottom ? "-mb-1" : "-mt-1"
        )}
      >
        {label}
      </p>
    </div>
  );
}

type SeatBoxProps = {
  number: string | number;
  status: SeatSaleStatus;
  selected?: boolean;
  dimmed?: boolean;
  className?: string;
  title?: string;
  onClick?: () => void;
  draggable?: boolean;
  dragging?: boolean;
  dropTarget?: boolean;
  disabled?: boolean;
  /** Custom section color (hex). Used when status is available. */
  fillColor?: string;
  style?: CSSProperties;
  /** Keep digit upright while the seat shell is rotated (deg to counter-rotate text only). */
  numberUprightBy?: number;
};

export function SeatBox({
  number,
  status,
  selected,
  dimmed,
  className,
  title,
  onClick,
  draggable,
  dragging,
  dropTarget,
  disabled,
  fillColor,
  style,
  numberUprightBy = 0,
}: SeatBoxProps) {
  const resolved: SeatSaleStatus = selected ? "selected" : status;
  const useCustom =
    Boolean(fillColor) &&
    (resolved === "available" || (resolved === "selected" && fillColor));

  return (
    <button
      type="button"
      tabIndex={-1}
      data-seat-box=""
      title={title}
      disabled={disabled}
      onClick={onClick}
      onMouseDown={(e) => {
        // Prevent focus steal so studio keyboard shortcuts keep working.
        e.preventDefault();
      }}
      style={{
        ...style,
        ...(useCustom && resolved === "available"
          ? { backgroundColor: fillColor, color: "#fff" }
          : null),
      }}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md text-[11px] font-black transition sm:h-9 sm:w-9",
        !useCustom || resolved !== "available"
          ? SEAT_STATUS_STYLES[resolved].box
          : "shadow-sm hover:brightness-95",
        dimmed && "opacity-40",
        dragging && "scale-110 opacity-70 ring-2 ring-brand-400",
        dropTarget && "ring-2 ring-brand-500 ring-offset-1",
        selected && "ring-2 ring-emerald-400 ring-offset-1",
        draggable && !disabled && "cursor-grab active:cursor-grabbing",
        className
      )}
    >
      <span
        className="inline-flex"
        style={
          numberUprightBy
            ? { transform: `rotate(${-numberUprightBy}deg)` }
            : undefined
        }
      >
        {number}
      </span>
    </button>
  );
}

export function SemicircleStage({
  label = "صحنه اجرا",
  className,
  x,
  y,
  width,
  height = 80,
  draggable = false,
  selected = false,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  label?: string;
  className?: string;
  /** Absolute left on the canvas (px). When omitted, sits centered at bottom. */
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  draggable?: boolean;
  selected?: boolean;
  onPointerDown?: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove?: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp?: (e: ReactPointerEvent<HTMLDivElement>) => void;
}) {
  const positioned = typeof x === "number" && typeof y === "number";

  return (
    <div
      className={cn(
        "z-[1] flex justify-center",
        positioned ? "absolute" : "pointer-events-none absolute inset-x-0 bottom-2",
        draggable && "pointer-events-auto cursor-grab touch-none active:cursor-grabbing",
        selected && "ring-2 ring-amber-400 ring-offset-2",
        className
      )}
      data-stage=""
      data-canvas-draggable=""
      style={
        positioned
          ? { left: x, top: y, width: width ?? "52%", height }
          : width
            ? { width }
            : undefined
      }
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      title={draggable ? "صحنه را بکشید تا جابه‌جا شود" : undefined}
    >
      <div className="relative h-full w-full">
        <div className="mx-auto h-full w-full rounded-t-full bg-linear-to-b from-amber-300 to-amber-500 shadow-[0_-6px_28px_rgba(245,158,11,0.35)]" />
        <p className="absolute inset-x-0 bottom-[22%] text-center text-sm font-black tracking-[0.25em] text-white drop-shadow-sm">
          {label}
        </p>
      </div>
    </div>
  );
}
