"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { adminTableClasses } from "@/components/admin/admin-table-classes";
import { getMyEventPublicUrl } from "@/lib/my-event/auth";
import { MY_EVENT_STATUS_LABELS } from "@/lib/my-event/constants";
import { formatAdminDateTime } from "@/lib/admin/format-datetime";

type MyEventOrganizerRow = {
  id: number;
  slug: string;
  displayName: string;
  status: string;
  phone: string | null;
  email: string | null;
  eventCount: number;
  userCount: number;
  createdAt: string;
};

type StatusFilter = "all" | "pending" | "active" | "suspended";

const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "همه وضعیت‌ها" },
  { value: "pending", label: "در انتظار تأیید" },
  { value: "active", label: "تأیید شده / فعال" },
  { value: "suspended", label: "مسدود" },
];

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

export default function AdminMyEventPage() {
  const [organizers, setOrganizers] = useState<MyEventOrganizerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<MyEventOrganizerRow | null>(null);
  const [form, setForm] = useState({
    displayName: "",
    slug: "",
    phone: "",
    email: "",
    bio: "",
    status: "pending",
  });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    fetch("/api/admin/my-event")
      .then((res) => res.json())
      .then((data) => setOrganizers(data))
      .finally(() => setLoading(false));
  }, []);

  const filteredOrganizers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return organizers.filter((org) => {
      if (statusFilter !== "all" && org.status !== statusFilter) return false;
      if (!query) return true;
      const haystack = [
        org.displayName,
        org.phone ?? "",
        org.email ?? "",
        org.slug,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [organizers, search, statusFilter]);

  async function updateStatus(id: number, status: string) {
    const response = await fetch("/api/admin/my-event", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });

    if (!response.ok) {
      alert("خطا در به‌روزرسانی وضعیت");
      return;
    }

    setOrganizers((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
  }

  function openEdit(org: MyEventOrganizerRow) {
    setEditing(org);
    setForm({
      displayName: org.displayName,
      slug: org.slug,
      phone: org.phone ?? "",
      email: org.email ?? "",
      bio: "",
      status: org.status,
    });
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/my-event/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "خطا");
      setOrganizers((prev) =>
        prev.map((o) =>
          o.id === editing.id
            ? {
                ...o,
                displayName: data.displayName,
                slug: data.slug,
                phone: data.phone,
                email: data.email,
                status: data.status,
              }
            : o
        )
      );
      setEditing(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "خطا");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(org: MyEventOrganizerRow) {
    if (
      !confirm(
        `برگزارکننده «${org.displayName}» و تمام رویدادهایش حذف شود؟`
      )
    )
      return;

    const res = await fetch(`/api/admin/my-event/${org.id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("خطا در حذف");
      return;
    }
    setOrganizers((prev) => prev.filter((o) => o.id !== org.id));
  }

  return (
    <main
      className="min-h-screen bg-slate-50 p-4 text-slate-900 md:p-8 dark:bg-slate-950 dark:text-slate-100"
      dir="rtl"
    >
      <div className="mx-auto max-w-6xl">
        <Link href="/admin" className="mb-4 inline-block text-sm font-bold text-emerald-600 dark:text-emerald-400">
          ← بازگشت به پنل
        </Link>
        <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100">برگزارکنندگان My Event</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          حساب‌های جدا از کاربران بلیت‌مال
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/admin/my-event/events"
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white"
          >
            رویدادهای My Event
          </Link>
        </div>

        <div className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_auto] md:items-end dark:border-slate-800 dark:bg-slate-900">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-500 dark:text-slate-400">جستجو</label>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="نام برند، شماره موبایل، ایمیل یا slug..."
              className={inputClass}
            />
          </div>
          <div className="min-w-[200px]">
            <label className="mb-1 block text-xs font-bold text-slate-500 dark:text-slate-400">فیلتر وضعیت</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className={inputClass}
            >
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          {loading
            ? "در حال بارگذاری..."
            : `${filteredOrganizers.length} از ${organizers.length} برگزارکننده`}
        </p>

        <div className={`mt-4 ${adminTableClasses.panel}`}>
          {loading ? (
            <p className={adminTableClasses.emptyInPanel}>در حال بارگذاری...</p>
          ) : organizers.length === 0 ? (
            <p className={adminTableClasses.emptyInPanel}>هنوز برگزارکننده‌ای ثبت نشده.</p>
          ) : filteredOrganizers.length === 0 ? (
            <p className={adminTableClasses.emptyInPanel}>نتیجه‌ای با این فیلتر یافت نشد.</p>
          ) : (
            <div className={adminTableClasses.panelInner}>
              <table className={adminTableClasses.table}>
                <thead className={adminTableClasses.thead}>
                  <tr>
                    <th className={adminTableClasses.th}>نام برند</th>
                    <th className={adminTableClasses.th}>شماره موبایل</th>
                    <th className={adminTableClasses.th}>تاریخ ثبت‌نام</th>
                    <th className={adminTableClasses.th}>صفحه</th>
                    <th className={adminTableClasses.th}>رویدادها</th>
                    <th className={adminTableClasses.th}>وضعیت</th>
                    <th className={adminTableClasses.th}>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrganizers.map((org) => (
                    <tr key={org.id} className={adminTableClasses.tr}>
                      <td className={adminTableClasses.td}>
                      <div className="font-bold text-slate-800 dark:text-slate-100">{org.displayName}</div>
                      {org.email ? (
                        <div className="text-xs text-slate-500 dark:text-slate-400" dir="ltr">
                          {org.email}
                        </div>
                      ) : null}
                    </td>
                      <td
                        className={`${adminTableClasses.td} font-mono text-slate-700 dark:text-slate-300`}
                        dir="ltr"
                      >
                        {org.phone ?? "—"}
                      </td>
                      <td
                        className={`${adminTableClasses.td} text-xs text-slate-600 whitespace-nowrap dark:text-slate-400`}
                      >
                        {formatAdminDateTime(org.createdAt)}
                      </td>
                      <td className={adminTableClasses.td}>
                      {org.status === "active" ? (
                        <a
                          href={getMyEventPublicUrl(org.slug)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-emerald-600 dark:text-emerald-400"
                          dir="ltr"
                        >
                          {getMyEventPublicUrl(org.slug)}
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500" dir="ltr">
                          پس از تأیید فعال می‌شود
                        </span>
                      )}
                    </td>
                      <td className={adminTableClasses.td}>{org.eventCount}</td>
                      <td className={adminTableClasses.td}>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          org.status === "active"
                            ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300"
                            : org.status === "suspended"
                              ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                        }`}
                      >
                        {MY_EVENT_STATUS_LABELS[org.status] ?? org.status}
                      </span>
                    </td>
                      <td className={adminTableClasses.td}>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(org)}
                          className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                        >
                          ویرایش
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(org)}
                          className="rounded-lg bg-red-50 px-3 py-1 text-xs font-bold text-red-700 dark:bg-red-500/15 dark:text-red-300"
                        >
                          حذف
                        </button>
                        {org.status !== "active" ? (
                          <button
                            type="button"
                            onClick={() => updateStatus(org.id, "active")}
                            className="rounded-lg bg-green-50 px-3 py-1 text-xs font-bold text-green-700 dark:bg-green-500/15 dark:text-green-300"
                          >
                            تأیید حساب
                          </button>
                        ) : null}
                        {org.status !== "suspended" ? (
                          <button
                            type="button"
                            onClick={() => updateStatus(org.id, "suspended")}
                            className="rounded-lg bg-red-50 px-3 py-1 text-xs font-bold text-red-700 dark:bg-red-500/15 dark:text-red-300"
                          >
                            مسدود
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handleSaveEdit}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 dark:text-slate-100"
          >
            <h2 className="text-lg font-black">ویرایش برگزارکننده</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                required
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                placeholder="نام برند"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-900 sm:col-span-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <input
                required
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="slug"
                dir="ltr"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="pending">در انتظار تأیید</option>
                <option value="active">فعال</option>
                <option value="suspended">مسدود</option>
              </select>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="موبایل"
                dir="ltr"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="ایمیل"
                dir="ltr"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div className="mt-6 flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white"
              >
                {saving ? "..." : "ذخیره"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold dark:border-slate-700"
              >
                انصراف
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}
