"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import SeatingPlanEditor from "@/components/seating/SeatingPlanEditor";
import CitySelect from "@/components/CitySelect";
import VenueListFiltersBar from "@/components/admin/VenueListFiltersBar";
import { createEmptyLayout } from "@/lib/seating/layout";
import type { OrganizerSeatingPlanRow, VenueCatalogRow } from "@/lib/seating/store";
import type { SeatingLayout } from "@/lib/seating/types";

type Tab = "admin" | "organizer" | "catalog";

function buildQuery(params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value && value !== "همه") sp.set(key, value);
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export default function AdminVenueTemplatesPage() {
  const [tab, setTab] = useState<Tab>("catalog");
  const [adminVenues, setAdminVenues] = useState<VenueCatalogRow[]>([]);
  const [catalogVenues, setCatalogVenues] = useState<VenueCatalogRow[]>([]);
  const [organizerPlans, setOrganizerPlans] = useState<OrganizerSeatingPlanRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [city, setCity] = useState("همه");
  const [sourceFilter, setSourceFilter] = useState("همه");
  const [organizerFilter, setOrganizerFilter] = useState("");

  const [editingCatalog, setEditingCatalog] = useState<VenueCatalogRow | null>(null);
  const [editingOrganizer, setEditingOrganizer] = useState<OrganizerSeatingPlanRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [venueMeta, setVenueMeta] = useState({ name: "", city: "تهران", address: "" });
  const [saving, setSaving] = useState(false);

  const loadAdmin = useCallback(async () => {
    const res = await fetch(
      `/api/admin/venue-templates${buildQuery({ q: search, city })}`
    );
    const data = await res.json();
    if (res.ok && Array.isArray(data)) setAdminVenues(data);
    else setAdminVenues([]);
  }, [search, city]);

  const loadCatalog = useCallback(async () => {
    const res = await fetch(
      `/api/admin/venues/catalog${buildQuery({
        q: search,
        city,
        source: sourceFilter === "همه" ? undefined : sourceFilter,
      })}`
    );
    const data = await res.json();
    if (res.ok && Array.isArray(data)) setCatalogVenues(data);
    else setCatalogVenues([]);
  }, [search, city, sourceFilter]);

  const loadOrganizer = useCallback(async () => {
    const res = await fetch(
      `/api/admin/organizer-seating-plans${buildQuery({
        q: search,
        city,
        organizer: organizerFilter,
      })}`
    );
    const data = await res.json();
    if (res.ok && Array.isArray(data)) setOrganizerPlans(data);
    else setOrganizerPlans([]);
  }, [search, city, organizerFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadAdmin(), loadCatalog(), loadOrganizer()]);
    setLoading(false);
  }, [loadAdmin, loadCatalog, loadOrganizer]);

  useEffect(() => {
    void load();
  }, [load]);

  function startCreating() {
    setCreating(true);
    setEditingCatalog(null);
    setEditingOrganizer(null);
    setVenueMeta({ name: "", city: "تهران", address: "" });
  }

  function startEditingCatalog(row: VenueCatalogRow) {
    setEditingCatalog(row);
    setCreating(false);
    setEditingOrganizer(null);
    setVenueMeta({ name: row.name, city: row.city || "تهران", address: row.address || "" });
  }

  async function handleSaveCatalog(layout: SeatingLayout) {
    const name = venueMeta.name.trim();
    if (!name) {
      alert("نام سالن الزامی است.");
      return;
    }
    if (!venueMeta.city.trim()) {
      alert("شهر سالن الزامی است.");
      return;
    }

    const layoutWithName = { ...layout, name };
    setSaving(true);
    try {
      let res: Response;
      if (editingCatalog) {
        res = await fetch(`/api/admin/venue-templates/${editingCatalog.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: layoutWithName.name,
            slug: editingCatalog.slug,
            city: venueMeta.city,
            address: venueMeta.address,
            isDefault: editingCatalog.isDefault,
            layout: layoutWithName,
          }),
        });
      } else if (creating) {
        res = await fetch("/api/admin/venue-templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: layoutWithName.name,
            city: venueMeta.city,
            address: venueMeta.address,
            layout: layoutWithName,
          }),
        });
      } else {
        return;
      }

      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        alert(data.error ?? `خطا در ذخیره سالن (${res.status})`);
        return;
      }

      setEditingCatalog(null);
      setCreating(false);
      setVenueMeta({ name: "", city: "تهران", address: "" });
      setTab("admin");
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveOrganizer(layout: SeatingLayout) {
    if (!editingOrganizer) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/organizer-seating-plans/${editingOrganizer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layout }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "خطا در ذخیره");
        return;
      }
      setEditingOrganizer(null);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCatalog(id: number, name: string) {
    if (!confirm(`سالن «${name}» از فهرست کل سالن‌ها حذف شود؟`)) return;
    const res = await fetch(`/api/admin/venue-templates?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "خطا در حذف");
      return;
    }
    await load();
  }

  async function handleDeleteOrganizer(id: number, name: string) {
    if (!confirm(`سالن طراحی‌شده «${name}» حذف شود؟`)) return;
    const res = await fetch(`/api/admin/organizer-seating-plans/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "خطا در حذف");
      return;
    }
    await load();
  }

  async function setDefault(id: number) {
    const tpl = catalogVenues.find((t) => t.id === id) ?? adminVenues.find((t) => t.id === id);
    if (!tpl) return;
    await fetch(`/api/admin/venue-templates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...tpl, isDefault: true, layout: tpl.layout }),
    });
    await load();
  }

  async function handlePromote(planId: number) {
    if (
      !confirm(
        "این سالن تأیید شود و به فهرست کل سالن‌ها اضافه گردد؟ پس از تأیید در جستجوی «مکان برگزاری» هنگام ثبت رویداد قابل انتخاب است."
      )
    )
      return;

    const res = await fetch(`/api/admin/organizer-seating-plans/${planId}/promote`, {
      method: "POST",
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "خطا");
      return;
    }
    alert(data.message);
    await load();
  }

  const activeCatalogLayout =
    editingCatalog?.layout ??
    (creating ? createEmptyLayout(venueMeta.name || "سالن جدید") : null);
  const activeOrganizerLayout = editingOrganizer?.layout ?? null;
  const editingActive = Boolean(activeCatalogLayout || activeOrganizerLayout);

  const tabCounts = {
    admin: adminVenues.length,
    organizer: organizerPlans.length,
    catalog: catalogVenues.length,
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8" dir="rtl">
      <div className="mx-auto max-w-6xl">
        <Link href="/admin" className="mb-4 inline-block text-sm font-bold text-blue-600">
          ← پنل ادمین
        </Link>
        <h1 className="text-3xl font-black text-slate-800">مدیریت سالن و صحنه</h1>
        <p className="mt-2 text-sm text-slate-500">
          سالن‌های طراحی‌شده توسط برگزارکننده پس از تأیید به «کل سالن‌ها» منتقل می‌شوند. فقط
          سالن‌های تأییدشده در جستجوی مکان برگزاری هنگام ثبت رویداد پیشنهاد می‌شوند.
        </p>

        {!editingActive ? (
          <>
            <div className="mt-6 flex flex-wrap gap-2">
              <TabButton
                active={tab === "catalog"}
                onClick={() => setTab("catalog")}
                label={`کل سالن‌ها (${tabCounts.catalog})`}
                color="emerald"
              />
              <TabButton
                active={tab === "admin"}
                onClick={() => setTab("admin")}
                label={`سالن‌های مدیر (${tabCounts.admin})`}
                color="blue"
              />
              <TabButton
                active={tab === "organizer"}
                onClick={() => setTab("organizer")}
                label={`سالن‌های برگزارکننده — در انتظار (${tabCounts.organizer})`}
                color="violet"
              />
            </div>

            <VenueListFiltersBar
              search={search}
              city={city}
              source={sourceFilter}
              organizer={organizerFilter}
              showSourceFilter={tab === "catalog"}
              showOrganizerFilter={tab === "organizer"}
              onSearchChange={setSearch}
              onCityChange={setCity}
              onSourceChange={setSourceFilter}
              onOrganizerChange={setOrganizerFilter}
            />
          </>
        ) : null}

        {activeCatalogLayout ? (
          <EditorPanel
            title={creating ? "سالن جدید (مدیر)" : `ویرایش سالن — ${editingCatalog?.name}`}
            subtitle={
              editingCatalog?.source === "organizer"
                ? `منبع: برگزارکننده ${editingCatalog.organizerName ?? ""}`
                : "منبع: مدیر سیستم"
            }
            accent="blue"
            venueMeta={venueMeta}
            setVenueMeta={setVenueMeta}
            showMeta
            layout={activeCatalogLayout}
            onSave={handleSaveCatalog}
            saving={saving}
            onCancel={() => {
              setEditingCatalog(null);
              setCreating(false);
            }}
          />
        ) : activeOrganizerLayout ? (
          <EditorPanel
            title="سالن برگزارکننده — در انتظار تأیید"
            subtitle={`رویداد: ${editingOrganizer?.eventTitle} · ${editingOrganizer?.organizerName}`}
            accent="violet"
            layout={activeOrganizerLayout}
            onSave={handleSaveOrganizer}
            saving={saving}
            onCancel={() => setEditingOrganizer(null)}
          />
        ) : tab === "catalog" ? (
          <>
            <button
              type="button"
              onClick={startCreating}
              className="mt-6 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white"
            >
              + سالن جدید (مدیر)
            </button>
            <VenueTable
              loading={loading}
              empty="سالنی در فهرست کل ثبت نشده."
              rows={catalogVenues}
              showSource
              onEdit={startEditingCatalog}
              onDelete={handleDeleteCatalog}
              onSetDefault={setDefault}
            />
          </>
        ) : tab === "admin" ? (
          <>
            <button
              type="button"
              onClick={startCreating}
              className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white"
            >
              + سالن جدید
            </button>
            <VenueTable
              loading={loading}
              empty="سالنی توسط مدیر ثبت نشده."
              rows={adminVenues}
              onEdit={startEditingCatalog}
              onDelete={handleDeleteCatalog}
              onSetDefault={setDefault}
            />
          </>
        ) : (
          <OrganizerTable
            loading={loading}
            plans={organizerPlans}
            onEdit={setEditingOrganizer}
            onDelete={handleDeleteOrganizer}
            onPromote={handlePromote}
          />
        )}
      </div>
    </main>
  );
}

function TabButton({
  active,
  onClick,
  label,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  color: "blue" | "violet" | "emerald";
}) {
  const activeClass = {
    blue: "bg-blue-600 text-white",
    violet: "bg-violet-600 text-white",
    emerald: "bg-emerald-600 text-white",
  }[color];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-5 py-2.5 text-sm font-black ${
        active ? activeClass : "bg-white text-slate-600 shadow-sm"
      }`}
    >
      {label}
    </button>
  );
}

function VenueTable({
  loading,
  empty,
  rows,
  showSource,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  loading: boolean;
  empty: string;
  rows: VenueCatalogRow[];
  showSource?: boolean;
  onEdit: (row: VenueCatalogRow) => void;
  onDelete: (id: number, name: string) => void;
  onSetDefault: (id: number) => void;
}) {
  if (loading) return <p className="mt-8 text-slate-500">در حال بارگذاری...</p>;
  if (rows.length === 0) {
    return <p className="mt-8 rounded-2xl bg-white p-6 text-slate-500 shadow-sm">{empty}</p>;
  }

  return (
    <div className="mt-8 space-y-3">
      {rows.map((row) => (
        <div
          key={row.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-5 shadow-sm"
        >
          <div className="min-w-0 flex-1">
            <p className="font-black text-slate-800">{row.name}</p>
            <p className="mt-1 text-xs text-slate-500">
              شهر: {row.city || "—"} · {row.seatCount.toLocaleString("fa-IR")} صندلی
              {row.isDefault ? " · پیش‌فرض" : ""}
              <span dir="ltr"> · {row.slug}</span>
            </p>
            {showSource ? (
              <p className="mt-1 text-xs font-bold text-slate-600">
                منبع:{" "}
                {row.source === "admin"
                  ? "مدیر سیستم"
                  : `برگزارکننده — ${row.organizerName ?? "نامشخص"}`}
              </p>
            ) : (
              <p className="mt-1 text-xs text-blue-700">منبع: مدیر سیستم</p>
            )}
            {row.address ? (
              <p className="mt-1 text-xs text-slate-400">{row.address}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {!row.isDefault ? (
              <button
                type="button"
                onClick={() => onSetDefault(row.id)}
                className="rounded-lg bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800"
              >
                پیش‌فرض
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onEdit(row)}
              className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold"
            >
              ویرایش
            </button>
            <button
              type="button"
              onClick={() => onDelete(row.id, row.name)}
              className="rounded-lg bg-red-50 px-3 py-1 text-xs font-bold text-red-700"
            >
              حذف
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function OrganizerTable({
  loading,
  plans,
  onEdit,
  onDelete,
  onPromote,
}: {
  loading: boolean;
  plans: OrganizerSeatingPlanRow[];
  onEdit: (plan: OrganizerSeatingPlanRow) => void;
  onDelete: (id: number, name: string) => void;
  onPromote: (id: number) => void;
}) {
  if (loading) return <p className="mt-8 text-slate-500">در حال بارگذاری...</p>;
  if (plans.length === 0) {
    return (
      <p className="mt-8 rounded-2xl bg-white p-6 text-slate-500 shadow-sm">
        سالن طراحی‌شده‌ای در انتظار تأیید نیست.
      </p>
    );
  }

  return (
    <div className="mt-8 space-y-3">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-100 bg-white p-5 shadow-sm"
        >
          <div>
            <p className="font-black text-slate-800">{plan.name || plan.eventPlace}</p>
            <p className="mt-1 text-sm text-slate-600">
              رویداد: {plan.eventTitle} — {plan.eventPlace} — {plan.eventCity}
            </p>
            <p className="mt-1 text-xs text-violet-700">
              برگزارکننده: {plan.organizerName}
              <span dir="ltr"> (@{plan.organizerSlug})</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {plan.seatCount.toLocaleString("fa-IR")} صندلی · وضعیت: در انتظار تأیید ·
              آخرین ویرایش: {new Date(plan.updatedAt).toLocaleString("fa-IR")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onEdit(plan)}
              className="rounded-lg bg-violet-100 px-3 py-1 text-xs font-bold text-violet-800"
            >
              ویرایش نقشه
            </button>
            <button
              type="button"
              onClick={() => onPromote(plan.id)}
              className="rounded-lg bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800"
            >
              تأیید و انتقال به کل سالن‌ها
            </button>
            <button
              type="button"
              onClick={() => onDelete(plan.id, plan.name || plan.eventTitle)}
              className="rounded-lg bg-red-50 px-3 py-1 text-xs font-bold text-red-700"
            >
              حذف
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function EditorPanel({
  title,
  subtitle,
  accent,
  venueMeta,
  setVenueMeta,
  showMeta,
  layout,
  onSave,
  saving,
  onCancel,
}: {
  title: string;
  subtitle?: string;
  accent: "blue" | "violet";
  venueMeta?: { name: string; city: string; address: string };
  setVenueMeta?: (v: { name: string; city: string; address: string }) => void;
  showMeta?: boolean;
  layout: SeatingLayout;
  onSave: (layout: SeatingLayout) => Promise<void>;
  saving: boolean;
  onCancel: () => void;
}) {
  const accentText = accent === "blue" ? "text-blue-300" : "text-violet-300";
  return (
    <div className="mt-8 rounded-3xl bg-slate-900 p-6 text-white">
      <p className={`mb-1 text-sm font-bold ${accentText}`}>{title}</p>
      {subtitle ? <p className="mb-4 text-xs text-slate-400">{subtitle}</p> : null}
      {showMeta && venueMeta && setVenueMeta ? (
        <div className="mb-4 space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-0 flex-1">
              <label className="mb-1.5 block text-sm font-bold">نام سالن</label>
              <input
                value={venueMeta.name}
                onChange={(e) => setVenueMeta({ ...venueMeta, name: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 text-sm"
                placeholder="مثلاً: سالن میلاد"
              />
            </div>
            <div className="w-36 shrink-0">
              <label className="mb-1.5 block text-sm font-bold">شهر</label>
              <CitySelect
                value={venueMeta.city}
                onChange={(city) => setVenueMeta({ ...venueMeta, city })}
                className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-bold">آدرس</label>
            <input
              type="text"
              value={venueMeta.address}
              onChange={(e) => setVenueMeta({ ...venueMeta, address: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 text-sm"
              placeholder="خیابان، پلاک، ..."
            />
          </div>
        </div>
      ) : null}
      <SeatingPlanEditor
        initialLayout={layout}
        onSave={onSave}
        saving={saving}
        hideVenueName={showMeta}
      />
      <button
        type="button"
        onClick={onCancel}
        className="mt-4 text-sm font-bold text-slate-400 hover:text-white"
      >
        انصراف
      </button>
    </div>
  );
}
