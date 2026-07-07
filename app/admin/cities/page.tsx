"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCities } from "@/components/CitiesProvider";
import type { CityWithUsage } from "@/lib/cities/types";

export default function AdminCitiesPage() {
  const { refresh: refreshGlobalCities } = useCities();
  const [cities, setCities] = useState<CityWithUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCityName, setNewCityName] = useState("");
  const [newCityPopular, setNewCityPopular] = useState(false);
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
    void load();
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
        body: JSON.stringify({ name, isPopular: newCityPopular }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "خطا در افزودن شهر");
        return;
      }
      setNewCityName("");
      setNewCityPopular(false);
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
    <main className="min-h-screen bg-slate-50 p-4 md:p-8" dir="rtl">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin" className="mb-4 inline-block text-sm font-bold text-blue-600">
          ← پنل ادمین
        </Link>
        <h1 className="text-3xl font-black text-slate-800">مدیریت شهرها</h1>
        <p className="mt-2 text-sm text-slate-500">
          شهرهای فعال در ثبت رویداد، سالن، جستجو، نوبار سایت و استودیو برگزارکننده نمایش داده
          می‌شوند.
        </p>

        <form
          onSubmit={handleAdd}
          className="mt-8 rounded-3xl bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-black text-slate-800">افزودن شهر جدید</h2>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div className="min-w-0 flex-1">
              <label className="mb-1.5 block text-sm font-bold text-slate-600">نام شهر</label>
              <input
                value={newCityName}
                onChange={(e) => setNewCityName(e.target.value)}
                placeholder="مثلاً: یزد"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
              />
            </div>
            <label className="flex items-center gap-2 pb-2.5 text-sm font-bold text-slate-600">
              <input
                type="checkbox"
                checked={newCityPopular}
                onChange={(e) => setNewCityPopular(e.target.checked)}
                className="rounded"
              />
              شهر پربازدید (نوبار)
            </label>
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
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {message}
          </p>
        ) : null}

        <div className="mt-8 overflow-hidden rounded-3xl bg-white shadow-sm">
          {loading ? (
            <p className="p-8 text-center text-slate-500">در حال بارگذاری...</p>
          ) : cities.length === 0 ? (
            <p className="p-8 text-center text-slate-500">شهری ثبت نشده.</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-right font-bold">شهر</th>
                  <th className="px-4 py-3 text-right font-bold">اسلاگ</th>
                  <th className="px-4 py-3 text-right font-bold">رویداد</th>
                  <th className="px-4 py-3 text-right font-bold">سالن</th>
                  <th className="px-4 py-3 text-right font-bold">نوبار</th>
                  <th className="px-4 py-3 text-right font-bold">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cities.map((city) => (
                  <tr key={city.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-bold text-slate-800">{city.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500" dir="ltr">
                      {city.slug}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {city.eventCount.toLocaleString("fa-IR")}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {city.venueCount.toLocaleString("fa-IR")}
                    </td>
                    <td className="px-4 py-3">
                      {city.isPopular ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                          پربازدید
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => void handleDelete(city)}
                        className="rounded-lg bg-red-50 px-3 py-1 text-xs font-bold text-red-700 hover:bg-red-100"
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
