"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthCard from "@/components/auth/AuthCard";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("رمز عبور و تکرار آن یکسان نیستند");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone: mobile, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "خطا در ثبت‌نام");

      await refresh();
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در ثبت‌نام");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="ثبت‌نام"
      description="برای خرید بلیت، حساب کاربری بسازید"
      footer={
        <>
          قبلاً ثبت‌نام کرده‌اید؟{" "}
          <Link
            href="/auth/login"
            className="font-bold text-red-600 hover:underline"
          >
            وارد شوید
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-neutral-700">
            نام
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="نام و نام خانوادگی"
            className="h-11 rounded-xl border-neutral-200 bg-white px-4 focus-visible:border-red-500 focus-visible:ring-red-100"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

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
            placeholder="حداقل ۸ کاراکتر"
            dir="ltr"
            className="h-11 rounded-xl border-neutral-200 bg-white px-4 text-left placeholder:text-right focus-visible:border-red-500 focus-visible:ring-red-100"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-neutral-700">
            تکرار رمز عبور
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="رمز عبور را دوباره وارد کنید"
            dir="ltr"
            className="h-11 rounded-xl border-neutral-200 bg-white px-4 text-left placeholder:text-right focus-visible:border-red-500 focus-visible:ring-red-100"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={8}
            required
            aria-invalid={!!error}
          />
        </div>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <Button
          type="submit"
          disabled={loading}
          className="h-11 w-full rounded-full bg-gray-900 text-sm font-bold hover:bg-black"
        >
          {loading ? "در حال ثبت‌نام..." : "ثبت‌نام"}
        </Button>
      </form>
    </AuthCard>
  );
}
