import { redirect } from "next/navigation";

/** @deprecated درخواست‌های بلیت‌مال در رویدادهای My Event بررسی می‌شوند. */
export default function AdminBilitmallListingsRedirectPage() {
  redirect("/admin/my-event/events?bilitmall=pending");
}
