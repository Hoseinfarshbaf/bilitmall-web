"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import MyEventShell from "@/components/my-event/MyEventShell";
import { getMyEventPublicUrl, normalizeMyEventSlug } from "@/lib/my-event/auth";
import { MY_EVENT_REGISTRATION_SUCCESS_MESSAGE } from "@/lib/my-event/constants";

export default function MyEventRegisterPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [slugInput, setSlugInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "ok" | "taken" | "invalid">(
    "idle"
  );

  const slug = useMemo(
    () => normalizeMyEventSlug(slugInput || displayName),
    [slugInput, displayName]
  );

  const previewUrl = slug ? getMyEventPublicUrl(slug) : "";

  useEffect(() => {
    if (!slug) {
      setSlugStatus("invalid");
      return;
    }

    setSlugStatus("checking");
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/my-event/slug-check?slug=${encodeURIComponent(slug)}`);
      const data = await res.json();
      if (!data.valid) setSlugStatus("invalid");
      else if (data.available) setSlugStatus("ok");
      else setSlugStatus("taken");
    }, 400);

    return () => clearTimeout(timer);
  }, [slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (slugStatus !== "ok") {
      alert("آدرس صفحه معتبر نیست یا قبلاً ثبت شده است.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/my-event/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, password, displayName, slug }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "خطا در ثبت‌نام");

      setSubmitted(true);
    } catch (error) {
      alert(error instanceof Error ? error.message : "خطا در ثبت‌نام");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <MyEventShell title="ثبت‌نام انجام شد">
        <div className="max-w-xl space-y-4 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6">
          <h2 className="text-xl font-black text-emerald-200">درخواست شما ثبت شد</h2>
          <p className="text-sm leading-7 text-slate-300">
            {MY_EVENT_REGISTRATION_SUCCESS_MESSAGE}
          </p>
          <p className="text-xs text-slate-500">
            پس از تأیید می‌توانید با شماره موبایل و رمز عبور وارد شوید.
          </p>
          <Link
            href="/my-event/login"
            className="inline-block rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold"
          >
            رفتن به صفحه ورود
          </Link>
        </div>
      </MyEventShell>
    );
  }

  return (
    <MyEventShell title="ثبت‌نام برگزارکننده">
      <p className="mb-4 text-sm text-slate-400">
        حساب برگزارکننده جدا از حساب خریدار بلیت‌مال است. پس از ثبت‌نام، تأیید ادمین لازم است.
      </p>
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-xl space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-300">نام شما</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-300">موبایل</label>
            <input
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-500"
              dir="ltr"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-300">رمز عبور</label>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            placeholder="حداقل ۸ کاراکتر"
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-300">نام برند / مجموعه</label>
          <input
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-500"
            placeholder="مثلاً کافه نیلوفر"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-300">
            آدرس صفحه (انگلیسی)
          </label>
          <input
            value={slugInput}
            onChange={(e) => setSlugInput(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-500"
            placeholder="cafe-niloufar"
            dir="ltr"
          />
          {previewUrl ? (
            <p className="mt-2 text-xs text-emerald-300" dir="ltr">
              {previewUrl}/نام-رویداد
            </p>
          ) : null}
          {slugStatus === "checking" ? (
            <p className="mt-2 text-xs text-slate-400">در حال بررسی آدرس...</p>
          ) : null}
          {slugStatus === "ok" ? (
            <p className="mt-2 text-xs text-emerald-400">این آدرس آزاد است.</p>
          ) : null}
          {slugStatus === "taken" ? (
            <p className="mt-2 text-xs text-red-400">این آدرس قبلاً ثبت شده — نام دیگری انتخاب کنید.</p>
          ) : null}
          {slugStatus === "invalid" && (slugInput || displayName) ? (
            <p className="mt-2 text-xs text-red-400">فقط حروف انگلیسی کوچک، عدد و خط تیره.</p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={loading || slugStatus !== "ok"}
          className="w-full rounded-xl bg-emerald-600 py-3 font-black hover:bg-emerald-500 disabled:opacity-60"
        >
          {loading ? "در حال ثبت..." : "ثبت‌نام"}
        </button>

        <p className="text-center text-sm text-slate-400">
          قبلاً تأیید شده‌اید؟{" "}
          <Link href="/my-event/login" className="font-bold text-emerald-300">
            ورود
          </Link>
        </p>
      </form>
    </MyEventShell>
  );
}
