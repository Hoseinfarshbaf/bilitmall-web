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
    <div className="min-h-screen bg-[#0a1210] text-white" dir="rtl">
      <MyEventHeader />
      <div className="mx-auto max-w-5xl px-4 py-16">
        <div className="mb-10 flex items-center gap-2 text-emerald-400">
          <Sparkles className="h-8 w-8" />
          <span className="text-2xl font-black">{MY_EVENT_STUDIO}</span>
        </div>

        <h1 className="max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
          صفحه اختصاصی رویداد خودت را بساز و لینکش را برای خریداران بفرست
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
          {MY_EVENT_BRAND} پلتفرم جدا از بلیت‌مال برای برگزارکنندگان است — با
          ساب‌دامین اختصاصی، کاور برند و صفحه یک‌صفحه‌ای.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          {loggedIn === null ? null : loggedIn ? (
            <Link
              href="/my-event/dashboard"
              className="rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-black hover:bg-emerald-500"
            >
              رفتن به داشبورد
            </Link>
          ) : (
            <>
              <Link
                href="/my-event/register"
                className="rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-black hover:bg-emerald-500"
              >
                ساخت حساب برگزارکننده
              </Link>
              <Link
                href="/my-event/login"
                className="rounded-2xl border border-emerald-500/30 px-6 py-4 text-sm font-black hover:bg-emerald-500/10"
              >
                ورود
              </Link>
            </>
          )}
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-emerald-500/10 bg-emerald-500/5 p-6">
            <Globe className="mb-3 h-6 w-6 text-emerald-300" />
            <h2 className="font-black">ساب‌دامین اختصاصی</h2>
            <p className="mt-2 text-sm text-slate-400">
              مثلاً <span dir="ltr">https://{MY_EVENT_URL_EXAMPLE}</span>
            </p>
          </div>
          <div className="rounded-3xl border border-emerald-500/10 bg-emerald-500/5 p-6">
            <Layers className="mb-3 h-6 w-6 text-emerald-300" />
            <h2 className="font-black">صفحه یک‌صفحه‌ای</h2>
            <p className="mt-2 text-sm text-slate-400">
              فقط رویداد و برند شما — بدون شلوغی بلیت‌مال
            </p>
          </div>
          <div className="rounded-3xl border border-emerald-500/10 bg-emerald-500/5 p-6">
            <Sparkles className="mb-3 h-6 w-6 text-emerald-300" />
            <h2 className="font-black">انتشار در بلیت‌مال</h2>
            <p className="mt-2 text-sm text-slate-400">
              در صورت تمایل، رویدادتان پس از تأیید ادمین در مارکت‌پلیس هم دیده می‌شود
            </p>
          </div>
        </div>

        <a
          href="/"
          className="mt-12 inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          بازدید از سایت بلیت‌مال
        </a>
      </div>
    </div>
  );
}
