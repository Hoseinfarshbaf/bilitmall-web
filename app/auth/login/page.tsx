"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import AuthCard from "@/components/auth/AuthCard";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-neutral-500">در حال بارگذاری...</p>}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");
  const { refresh } = useAuth();
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: mobile, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "خطا در ورود");

      await refresh();
      const destination =
        nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")
          ? nextPath
          : "/";
      router.push(destination);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در ورود");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="ورود به حساب"
      description="با شماره موبایل و رمز عبور وارد شوید"
      footer={
        <>
          حساب کاربری ندارید؟{" "}
          <Link
            href="/auth/register"
            className="font-bold text-red-600 hover:underline"
          >
            ثبت‌نام کنید
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="mobile" className="text-neutral-700">
            شماره موبایل
          </Label>
          <Input
            id="mobile"
            type="tel"
            inputMode="numeric"
            placeholder="۰۹۱۲۳۴۵۶۷۸۹"
            dir="ltr"
            className="h-11 rounded-xl border-neutral-200 bg-white px-4 text-left placeholder:text-right focus-visible:border-red-500 focus-visible:ring-red-100"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-neutral-700">
            رمز عبور
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="رمز عبور خود را وارد کنید"
            dir="ltr"
            className="h-11 rounded-xl border-neutral-200 bg-white px-4 text-left placeholder:text-right focus-visible:border-red-500 focus-visible:ring-red-100"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <Button
          type="submit"
          disabled={loading}
          className="h-11 w-full rounded-full bg-gray-900 text-sm font-bold hover:bg-black"
        >
          {loading ? "در حال ورود..." : "ورود"}
        </Button>
      </form>
    </AuthCard>
  );
}
