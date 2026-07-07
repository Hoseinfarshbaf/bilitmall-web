"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import MyEventShell from "@/components/my-event/MyEventShell";

export default function MyEventLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/my-event/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "خطا در ورود");

      router.push("/my-event/dashboard");
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "خطا در ورود");
    } finally {
      setLoading(false);
    }
  }

  return (
    <MyEventShell title="ورود برگزارکننده">
      <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-300">موبایل</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-500"
            placeholder="09123456789"
            dir="ltr"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-300">رمز عبور</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-emerald-600 py-3 font-black hover:bg-emerald-500 disabled:opacity-60"
        >
          {loading ? "در حال ورود..." : "ورود"}
        </button>
        <p className="text-center text-sm text-slate-400">
          حساب ندارید؟{" "}
          <Link href="/my-event/register" className="font-bold text-emerald-300">
            ثبت‌نام
          </Link>
        </p>
      </form>
    </MyEventShell>
  );
}
