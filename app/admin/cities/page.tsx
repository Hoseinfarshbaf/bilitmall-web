"use client";

import { useEffect, useState } from "react";
import { useCities } from "@/components/CitiesProvider";
import AdminBackLink from "@/components/admin/AdminBackLink";
import { adminTableClasses } from "@/components/admin/admin-table-classes";
import type { CityWithUsage } from "@/lib/cities/types";

export default function AdminCitiesPage() {
  const { refresh: refreshGlobalCities } = useCities();
  const [cities, setCities] = useState<CityWithUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCityName, setNewCityName] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/cities");
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setCities(data);
      } else {
        setCities([]);
        setMessage(data.error ?? "خطا در بارگذاری شهرها");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/admin/cities")
      .then(async (res) => {
        if (cancelled) return;
        const data = await res.json();
        if (!cancelled && res.ok && Array.isArray(data)) {
          setCities(data);
        } else if (!cancelled) {
          setCities([]);
          setMessage(data.error ?? "خطا در بارگذاری شهرها");
        }
      })
      .catch(() => {
        if (!cancelled) setCities([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const name = newCityName.trim();
    if (!name) return;

    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "خطا در افزودن شهر");
        return;
      }
      setNewCityName("");
      setMessage(`شهر «${name}» اضافه شد و در تمام بخش‌های سیستم فعال است.`);
      await load();
      await refreshGlobalCities();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(city: CityWithUsage) {
    if (
      !confirm(
        `شهر «${city.name}» حذف شود؟\n\nتوجه: فقط شهرهایی که در هیچ رویداد یا سالنی استفاده نشده‌اند قابل حذف هستند.`
      )
    ) {
      return;
    }

    const res = await fetch(`/api/admin/cities?id=${city.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "خطا در حذف");
      return;
    }
    setMessage(`شهر «${city.name}» حذف شد.`);
    await load();
    await refreshGlobalCities();
  }

  return (
    <main
      className="min-h-screen bg-slate-50 p-4 text-slate-900 md:p-8 dark:bg-slate-950 dark:text-slate-100"
      dir="rtl"
    >
      <div className="mx-auto max-w-4xl">
        <AdminBackLink />
        <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100">مدیریت شهرها</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          شهرهای فعال در ثبت رویداد، سالن و فرم‌های سیستم نمایش داده می‌شوند. در سایت عمومی،
          فقط شهرهایی که رویداد فعال دارند دیده می‌شوند و ۵ شهر اول بر اساس تعداد رویداد
          به‌صورت خودکار در انتخاب شهر نمایش داده می‌شوند.
        </p>

        <form
          onSubmit={handleAdd}
          className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">افزودن شهر جدید</h2>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div className="min-w-0 flex-1">
              <label className="mb-1.5 block text-sm font-bold text-slate-600 dark:text-slate-300">نام شهر</label>
              <input
                value={newCityName}
                onChange={(e) => setNewCityName(e.target.value)}
                placeholder="مثلاً: یزد"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <button
              type="submit"
              disabled={saving || !newCityName.trim()}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white disabled:opacity-60"
            >
              {saving ? "در حال افزودن..." : "افزودن شهر"}
            </button>
          </div>
        </form>

        {message ? (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
            {message}
          </p>
        ) : null}

        <div className={`mt-8 ${adminTableClasses.panel}`}>
          {loading ? (
            <p className={adminTableClasses.emptyInPanel}>در حال بارگذاری...</p>
          ) : cities.length === 0 ? (
            <p className={adminTableClasses.emptyInPanel}>شهری ثبت نشده.</p>
          ) : (
            <div className={adminTableClasses.panelInner}>
              <table className={adminTableClasses.table}>
                <thead className={adminTableClasses.thead}>
                  <tr>
                    <th className={adminTableClasses.th}>شهر</th>
                    <th className={adminTableClasses.th}>اسلاگ</th>
                    <th className={adminTableClasses.th}>رویداد</th>
                    <th className={adminTableClasses.th}>سالن</th>
                    <th className={adminTableClasses.th}>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {cities.map((city) => (
                    <tr key={city.id} className={adminTableClasses.tr}>
                      <td className={`${adminTableClasses.td} font-bold text-slate-800 dark:text-slate-100`}>
                        {city.name}
                      </td>
                      <td
                        className={`${adminTableClasses.td} font-mono text-xs text-slate-500 dark:text-slate-400`}
                        dir="ltr"
                      >
                        {city.slug}
                      </td>
                      <td className={adminTableClasses.td}>
                        {city.eventCount.toLocaleString("fa-IR")}
                      </td>
                      <td className={adminTableClasses.td}>
                        {city.venueCount.toLocaleString("fa-IR")}
                      </td>
                      <td className={adminTableClasses.td}>
                      <button
                        type="button"
                        onClick={() => void handleDelete(city)}
                        className="rounded-lg bg-red-50 px-3 py-1 text-xs font-bold text-red-700 hover:bg-red-100 dark:bg-red-500/15 dark:text-red-300 dark:hover:bg-red-500/25"
                      >
                        حذف
                      </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
