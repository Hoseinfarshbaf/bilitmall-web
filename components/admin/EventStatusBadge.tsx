import type { EventItem } from "@/lib/events/types";
import { getAdminEventStatusDisplay } from "@/lib/events/status";

export default function EventStatusBadge({
  event,
}: {
  event: Pick<
    EventItem,
    "status" | "published" | "date" | "time" | "days" | "storedStatus"
  >;
}) {
  const { label, className } = getAdminEventStatusDisplay(event);

  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${className}`}
    >
      {label}
    </span>
  );
}
