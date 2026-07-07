export function formatAdminDateTime(iso: string): string {
  return new Date(iso).toLocaleString("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatAdminDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
