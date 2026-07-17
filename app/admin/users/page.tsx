"use client";

import { useEffect, useState } from "react";
import AdminBackLink from "@/components/admin/AdminBackLink";
import { adminTableClasses } from "@/components/admin/admin-table-classes";

type UserRow = {
  id: number;
  phone: string;
  name: string;
  email: string | null;
  orderCount: number;
  createdAt: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [saving, setSaving] = useState(false);

  function loadUsers() {
    fetch("/api/admin/users")
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function openEdit(user: UserRow) {
    setEditing(user);
    setEditName(user.name);
    setEditEmail(user.email ?? "");
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
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
          u.id === editing.id ? { ...u, name: data.name, email: data.email } : u
        )
      );
      setEditing(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "خطا در ذخیره");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(user: UserRow) {
    if (!confirm(`حساب «${user.name}» حذف شود؟ سفارش‌های او هم پاک می‌شود.`)) return;

    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("خطا در حذف");
      return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== user.id));
  }

  return (
    <main
      className="min-h-screen bg-slate-50 p-4 text-slate-900 md:p-8 dark:bg-slate-950 dark:text-slate-100"
      dir="rtl"
    >
      <div className="mx-auto max-w-6xl">
        <AdminBackLink />
        <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100">کاربران بلیت‌مال</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          خریداران سایت — جدا از حساب‌های برگزارکننده My Event
        </p>

        <div className={`mt-8 ${adminTableClasses.panel}`}>
          {loading ? (
            <p className={adminTableClasses.emptyInPanel}>در حال بارگذاری...</p>
          ) : users.length === 0 ? (
            <p className={adminTableClasses.emptyInPanel}>هنوز کاربری ثبت‌نام نکرده.</p>
          ) : (
            <div className={adminTableClasses.panelInner}>
              <table className={adminTableClasses.table}>
                <thead className={adminTableClasses.thead}>
                  <tr>
                    <th className={adminTableClasses.th}>نام</th>
                    <th className={adminTableClasses.th}>موبایل</th>
                    <th className={adminTableClasses.th}>ایمیل</th>
                    <th className={adminTableClasses.th}>خریدها</th>
                    <th className={adminTableClasses.th}>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className={adminTableClasses.tr}>
                      <td className={`${adminTableClasses.td} font-bold`}>{user.name}</td>
                      <td className={adminTableClasses.td} dir="ltr">
                        {user.phone}
                      </td>
                      <td className={adminTableClasses.td}>{user.email ?? "—"}</td>
                      <td className={adminTableClasses.td}>{user.orderCount}</td>
                      <td className={adminTableClasses.td}>
                      <div className="flex flex-wrap gap-2">
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
                          className="rounded-lg bg-red-50 px-3 py-1 text-xs font-bold text-red-700 dark:bg-red-500/15 dark:text-red-300"
                        >
                          حذف
                        </button>
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
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <input
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="ایمیل"
                dir="ltr"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
    </main>
  );
}
