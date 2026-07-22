"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Globe, Layers, Sparkles } from "lucide-react";
import MyEventHeader from "@/components/my-event/MyEventHeader";
import { MY_EVENT_BRAND, MY_EVENT_STUDIO, MY_EVENT_URL_EXAMPLE } from "@/lib/my-event/constants";

export default function MyEventLandingPage() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/my-event/me")
      .then((res) => setLoggedIn(res.ok))
      .catch(() => setLoggedIn(false));
  }, []);

  return (
    <div
      className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-[#0a1210] dark:text-white"
      dir="rtl"
    >
      <MyEventHeader />
      <div className="mx-auto max-w-5xl px-4 py-16">
        <div className="mb-10 flex items-center gap-2 text-brand-600 dark:text-brand-400">
          <Sparkles className="h-8 w-8" />
          <span className="text-2xl font-black">{MY_EVENT_STUDIO}</span>
        </div>

        <h1 className="max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
          صفحه فروش اختصاصی خودت را روی بلیت‌مال بساز
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-600 dark:text-slate-300">
          {MY_EVENT_BRAND} برای برگزارکنندگان است — با ساب‌دامین اختصاصی روی
          بلیت‌مال، کاور برند و مدیریت رویدادها.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          {loggedIn === null ? null : loggedIn ? (
            <Link
              href="/my-event/dashboard"
              className="rounded-2xl bg-brand-600 px-6 py-4 text-sm font-black text-white hover:bg-brand-500"
            >
              رفتن به داشبورد
            </Link>
          ) : (
            <>
              <Link
                href="/my-event/register"
                className="rounded-2xl bg-brand-600 px-6 py-4 text-sm font-black text-white hover:bg-brand-500"
              >
                ساخت حساب برگزارکننده
              </Link>
              <Link
                href="/my-event/login"
                className="rounded-2xl border border-brand-500/40 px-6 py-4 text-sm font-black text-brand-700 hover:bg-brand-500/10 dark:border-brand-500/30 dark:text-white"
              >
                ورود
              </Link>
            </>
          )}
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-brand-500/20 bg-brand-500/5 p-6 dark:border-brand-500/10">
            <Globe className="mb-3 h-6 w-6 text-brand-600 dark:text-brand-300" />
            <h2 className="font-black">ساب‌دامین روی بلیت‌مال</h2>
            <p className="mt-2 text-sm text-neutral-500 dark:text-slate-400">
              مثلاً <span dir="ltr">https://{MY_EVENT_URL_EXAMPLE}</span>
            </p>
          </div>
          <div className="rounded-3xl border border-brand-500/20 bg-brand-500/5 p-6 dark:border-brand-500/10">
            <Layers className="mb-3 h-6 w-6 text-brand-600 dark:text-brand-300" />
            <h2 className="font-black">صفحه یک‌صفحه‌ای</h2>
            <p className="mt-2 text-sm text-neutral-500 dark:text-slate-400">
              فقط رویداد و برند شما — بدون شلوغی بلیت‌مال
            </p>
          </div>
          <div className="rounded-3xl border border-brand-500/20 bg-brand-500/5 p-6 dark:border-brand-500/10">
            <Sparkles className="mb-3 h-6 w-6 text-brand-600 dark:text-brand-300" />
            <h2 className="font-black">انتشار در بلیت‌مال</h2>
            <p className="mt-2 text-sm text-neutral-500 dark:text-slate-400">
              در صورت تمایل، رویدادتان پس از تأیید ادمین در مارکت‌پلیس هم دیده می‌شود
            </p>
          </div>
        </div>

        <Link
          href="/"
          className="mt-12 inline-flex items-center gap-2 text-sm font-bold text-neutral-500 hover:text-neutral-900 dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          بازدید از سایت بلیت‌مال
        </Link>
      </div>
    </div>
  );
}
