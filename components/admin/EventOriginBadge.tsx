import {
  OWNERSHIP_LABELS,
  resolveEventOrigin,
  type EventOwnershipType,
} from "@/lib/events/admin-origin";
import type { EventItem } from "@/lib/events/types";
import { cn } from "@/lib/utils";

const OWNERSHIP_STYLES: Record<EventOwnershipType, string> = {
  bilitmall:
    "bg-brand-100 text-brand-800 dark:bg-brand-500/20 dark:text-brand-300",
  linked: "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300",
  organizer:
    "bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300",
};

type EventOriginBadgeProps = {
  event: EventItem;
  className?: string;
};

export default function EventOriginBadge({ event, className }: EventOriginBadgeProps) {
  const origin = resolveEventOrigin(event);

  return (
    <span
      className={cn(
        "inline-flex max-w-full flex-wrap items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold leading-5",
        OWNERSHIP_STYLES[origin.ownership],
        className
      )}
      title={origin.detail ?? origin.label}
    >
      <span>{OWNERSHIP_LABELS[origin.ownership]}</span>
      {origin.ownership === "linked" && origin.detail ? (
        <>
          <span aria-hidden>·</span>
          <span>{origin.detail}</span>
        </>
      ) : null}
      {origin.ownership === "organizer" && origin.detail ? (
        <>
          <span aria-hidden>·</span>
          <span className="font-medium opacity-90">{origin.detail}</span>
        </>
      ) : null}
    </span>
  );
}
