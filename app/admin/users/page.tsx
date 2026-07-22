"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AdminBackLink from "@/components/admin/AdminBackLink";
import { adminTableClasses } from "@/components/admin/admin-table-classes";
import { MY_EVENT_STATUS_LABELS } from "@/lib/my-event/constants";
import { cn } from "@/lib/utils";
import type { RoleSummary } from "@/lib/bilitmall/roles";

type DirectorySource = "bilitmall" | "my_event";

type DirectoryRow = {
  source: DirectorySource;
  id: number;
  name: string;
  phone: string;
  email: string | null;
  role: RoleSummary;
  orderCount?: number;
  organizerDisplayName?: string;
  organizerStatus?: string;
  organizerId?: number;
  createdAt: string;
};

type SourceFilter = "all" | DirectorySource;

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

function roleBadgeClass(slug: string) {
  switch (slug) {
    case "admin":
      return "bg-brand-100 text-brand-800 dark:bg-brand-500/20 dark:text-brand-300";
    case "manager":
      return "bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300";
    case "organizer":
      return "bg-brand-100 text-brand-800 dark:bg-brand-500/20 dark:text-brand-300";
    case "user":
      return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200";
    default:
      return "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300";
  }
}

function rowKey(row: DirectoryRow) {
  return `${row.source}:${row.id}`;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<DirectoryRow[]>([]);
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [roleFilter, setRoleFilter] = useState<number | "all">("all");
  const [search, setSearch] = useState("");

  const [editing, setEditing] = useState<DirectoryRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [editingRole, setEditingRole] = useState<RoleSummary | null>(null);
  const [editRoleName, setEditRoleName] = useState("");
  const [editRoleDescription, setEditRoleDescription] = useState("");
  const [roleSaving, setRoleSaving] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/roles"),
      ]);
      const usersData = await usersRes.json();
      const rolesData = await rolesRes.json();
      if (!usersRes.ok) throw new Error(usersData.error ?? "خطا در بارگذاری کاربران");
      if (!rolesRes.ok) throw new Error(rolesData.error ?? "خطا در بارگذاری نقش‌ها");
      setUsers(usersData);
      setRoles(rolesData);
    } catch (err) {
      alert(err instanceof Error ? err.message : "خطا");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((row) => {
      if (sourceFilter !== "all" && row.source !== sourceFilter) return false;
      if (roleFilter !== "all" && row.role.id !== roleFilter) return false;
      if (!q) return true;
      return (
        row.name.toLowerCase().includes(q) ||
        row.phone.includes(q) ||
        (row.email ?? "").toLowerCase().includes(q) ||
        (row.organizerDisplayName ?? "").toLowerCase().includes(q) ||
        row.role.name.toLowerCase().includes(q)
      );
    });
  }, [users, sourceFilter, roleFilter, search]);

  function openEdit(user: DirectoryRow) {
    if (user.source !== "bilitmall") return;
    setEditing(user);
    setEditName(user.name);
    setEditEmail(user.email ?? "");
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing || editing.source !== "bilitmall") return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, email: editEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "خطا");
      setUsers((prev) =>
        prev.map((u) =>
          u.source === "bilitmall" && u.id === editing.id
            ? { ...u, name: data.name, email: data.email }
            : u
        )
      );
      setEditing(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "خطا در ذخیره");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(user: DirectoryRow) {
    if (user.source !== "bilitmall") return;
    if (!confirm(`حساب «${user.name}» حذف شود؟ سفارش‌های او هم پاک می‌شود.`)) return;

    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("خطا در حذف");
      return;
    }
    setUsers((prev) => prev.filter((u) => !(u.source === "bilitmall" && u.id === user.id)));
  }

  async function handleRoleChange(user: DirectoryRow, roleId: number) {
    if (user.role.id === roleId) return;
    const res = await fetch("/api/admin/directory", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: user.source, id: user.id, roleId }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "خطا در تغییر نقش");
      return;
    }
    setUsers((prev) =>
      prev.map((u) => (rowKey(u) === rowKey(user) ? { ...u, role: data.role } : u))
    );
  }

  async function handleCreateRole(e: React.FormEvent) {
    e.preventDefault();
    setRoleSaving(true);
    try {
      const res = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRoleName,
          description: newRoleDescription || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "خطا");
      setRoles((prev) => [...prev, data].sort((a, b) => Number(b.isSystem) - Number(a.isSystem)));
      setNewRoleName("");
      setNewRoleDescription("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "خطا");
    } finally {
      setRoleSaving(false);
    }
  }

  async function handleUpdateRole(e: React.FormEvent) {
    e.preventDefault();
    if (!editingRole) return;
    setRoleSaving(true);
    try {
      const res = await fetch(`/api/admin/roles/${editingRole.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editRoleName,
          description: editRoleDescription || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "خطا");
      setRoles((prev) => prev.map((r) => (r.id === data.id ? data : r)));
      setUsers((prev) =>
        prev.map((u) => (u.role.id === data.id ? { ...u, role: data } : u))
      );
      setEditingRole(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "خطا");
    } finally {
      setRoleSaving(false);
    }
  }

  async function handleDeleteRole(role: RoleSummary) {
    if (!confirm(`نقش «${role.name}» حذف شود؟`)) return;
    const res = await fetch(`/api/admin/roles/${role.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "خطا در حذف نقش");
      return;
    }
    setRoles((prev) => prev.filter((r) => r.id !== role.id));
    if (roleFilter === role.id) setRoleFilter("all");
  }

  return (
    <main
      className="min-h-screen bg-slate-50 p-4 text-slate-900 md:p-8 dark:bg-slate-950 dark:text-slate-100"
      dir="rtl"
    >
      <div className="mx-auto max-w-6xl">
        <AdminBackLink />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100">
              کاربران و نقش‌ها
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              فهرست واحد خریداران بلیت‌مال و حساب‌های برگزارکننده My Event — با نمایش و تغییر نقش
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRoleModalOpen(true)}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white"
          >
            مدیریت نقش‌ها
          </button>
        </div>

        <div className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="md:col-span-3">
            <label className="mb-1 block text-xs font-bold text-slate-500 dark:text-slate-400">
              جستجو
            </label>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="نام، موبایل، ایمیل، برگزارکننده، نقش..."
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-500 dark:text-slate-400">
              منبع حساب
            </label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as SourceFilter)}
              className={inputClass}
            >
              <option value="all">همه</option>
              <option value="bilitmall">بلیت‌مال</option>
              <option value="my_event">My Event</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-500 dark:text-slate-400">
              نقش
            </label>
            <select
              value={roleFilter === "all" ? "all" : String(roleFilter)}
              onChange={(e) =>
                setRoleFilter(e.target.value === "all" ? "all" : Number(e.target.value))
              }
              className={inputClass}
            >
              <option value="all">همه نقش‌ها</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={`mt-8 ${adminTableClasses.panel}`}>
          {loading ? (
            <p className={adminTableClasses.emptyInPanel}>در حال بارگذاری...</p>
          ) : filteredUsers.length === 0 ? (
            <p className={adminTableClasses.emptyInPanel}>کاربری با این فیلتر یافت نشد.</p>
          ) : (
            <div className={adminTableClasses.panelInner}>
              <table className={adminTableClasses.table}>
                <thead className={adminTableClasses.thead}>
                  <tr>
                    <th className={adminTableClasses.th}>نام</th>
                    <th className={adminTableClasses.th}>موبایل</th>
                    <th className={adminTableClasses.th}>منبع</th>
                    <th className={adminTableClasses.th}>نقش</th>
                    <th className={adminTableClasses.th}>جزئیات</th>
                    <th className={adminTableClasses.th}>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={rowKey(user)} className={adminTableClasses.tr}>
                      <td className={cn(adminTableClasses.td, adminTableClasses.tdAccent)}>
                        <div className="font-bold">{user.name}</div>
                        {user.email ? (
                          <div className="text-xs text-slate-500 dark:text-slate-400" dir="ltr">
                            {user.email}
                          </div>
                        ) : null}
                      </td>
                      <td className={adminTableClasses.td} dir="ltr">
                        {user.phone}
                      </td>
                      <td className={adminTableClasses.td}>
                        <span
                          className={cn(
                            "inline-block rounded-full px-2 py-1 text-xs font-bold",
                            user.source === "bilitmall"
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                              : "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
                          )}
                        >
                          {user.source === "bilitmall" ? "بلیت‌مال" : "My Event"}
                        </span>
                      </td>
                      <td className={adminTableClasses.td}>
                        <select
                          value={user.role.id}
                          onChange={(e) => handleRoleChange(user, Number(e.target.value))}
                          className={cn(
                            "rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold dark:border-slate-700 dark:bg-slate-800",
                            roleBadgeClass(user.role.slug)
                          )}
                          title={user.role.description ?? user.role.name}
                        >
                          {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className={`${adminTableClasses.td} text-xs`}>
                        {user.source === "bilitmall" ? (
                          <span>{user.orderCount ?? 0} خرید</span>
                        ) : (
                          <div>
                            <div className="font-bold">{user.organizerDisplayName}</div>
                            <div className="text-slate-500 dark:text-slate-400">
                              {MY_EVENT_STATUS_LABELS[user.organizerStatus ?? ""] ??
                                user.organizerStatus}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className={adminTableClasses.td}>
                        <div className="flex flex-wrap gap-2">
                          {user.source === "bilitmall" ? (
                            <>
                              <button
                                type="button"
                                onClick={() => openEdit(user)}
                                className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                              >
                                ویرایش
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(user)}
                                className="rounded-lg bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
                              >
                                حذف
                              </button>
                            </>
                          ) : (
                            <Link
                              href="/admin/my-event"
                              className="rounded-lg bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
                            >
                              برگزارکنندگان
                            </Link>
                          )}
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
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 dark:text-slate-100"
          >
            <h2 className="text-lg font-black">ویرایش کاربر</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400" dir="ltr">
              {editing.phone}
            </p>
            <div className="mt-4 space-y-3">
              <input
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="نام"
                className={inputClass}
              />
              <input
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="ایمیل"
                dir="ltr"
                className={inputClass}
              />
            </div>
            <div className="mt-6 flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white"
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

      {roleModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-black">مدیریت نقش‌ها</h2>
              <button
                type="button"
                onClick={() => {
                  setRoleModalOpen(false);
                  setEditingRole(null);
                }}
                className="text-sm font-bold text-slate-500"
              >
                بستن
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="mt-4 space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">نقش جدید</p>
              <input
                required
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="نام نقش (مثلاً پشتیبان)"
                className={inputClass}
              />
              <input
                value={newRoleDescription}
                onChange={(e) => setNewRoleDescription(e.target.value)}
                placeholder="توضیح (اختیاری)"
                className={inputClass}
              />
              <button
                type="submit"
                disabled={roleSaving}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white"
              >
                {roleSaving ? "..." : "ایجاد نقش"}
              </button>
            </form>

            <ul className="mt-4 space-y-2">
              {roles.map((role) => (
                <li
                  key={role.id}
                  className="rounded-xl border border-slate-200 p-3 dark:border-slate-700"
                >
                  {editingRole?.id === role.id ? (
                    <form onSubmit={handleUpdateRole} className="space-y-2">
                      <input
                        required
                        value={editRoleName}
                        onChange={(e) => setEditRoleName(e.target.value)}
                        className={inputClass}
                      />
                      <input
                        value={editRoleDescription}
                        onChange={(e) => setEditRoleDescription(e.target.value)}
                        placeholder="توضیح"
                        className={inputClass}
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={roleSaving}
                          className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-bold text-white"
                        >
                          ذخیره
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingRole(null)}
                          className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-bold dark:border-slate-700"
                        >
                          انصراف
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-xs font-bold",
                              roleBadgeClass(role.slug)
                            )}
                          >
                            {role.name}
                          </span>
                          {role.isSystem ? (
                            <span className="text-[11px] text-slate-400">سیستمی</span>
                          ) : null}
                        </div>
                        {role.description ? (
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {role.description}
                          </p>
                        ) : null}
                        <p className="mt-0.5 text-[11px] text-slate-400" dir="ltr">
                          {role.slug}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRole(role);
                            setEditRoleName(role.name);
                            setEditRoleDescription(role.description ?? "");
                          }}
                          className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                        >
                          ویرایش
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRole(role)}
                          className="rounded-lg bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </main>
  );
}
