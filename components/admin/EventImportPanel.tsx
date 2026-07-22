"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Link2, Loader2, SearchCheck, Sparkles } from "lucide-react";
import type { EventFormData } from "@/lib/events/types";
import type { ImportQuestion, ImportResult } from "@/lib/events/import/types";
import EventImagePreviews from "@/components/admin/EventImagePreviews";

const PROVIDER_LABELS: Record<string, string> = {
  honarticket: "هنر تیکت",
  tiwall: "تیوال",
};

const ASSETS_DOWNLOAD_STORAGE_KEY = "event-assets-download";

type EventImportPanelProps = {
  onApply: (draft: EventFormData) => void;
  initialImportUrl?: string;
};

export default function EventImportPanel({ onApply, initialImportUrl }: EventImportPanelProps) {
  const [url, setUrl] = useState(() => initialImportUrl?.trim() ?? "");
  const [trackedImportUrl, setTrackedImportUrl] = useState(initialImportUrl);
  if (initialImportUrl !== trackedImportUrl) {
    setTrackedImportUrl(initialImportUrl);
    if (initialImportUrl?.trim()) setUrl(initialImportUrl.trim());
  }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [assetsDownloadNotice, setAssetsDownloadNotice] = useState<{
    folderPath: string;
    warnings: string[];
  } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const raw = sessionStorage.getItem(ASSETS_DOWNLOAD_STORAGE_KEY);
        if (!raw) return;
        sessionStorage.removeItem(ASSETS_DOWNLOAD_STORAGE_KEY);
        const parsed = JSON.parse(raw) as { folderPath?: string; warnings?: string[] };
        if (parsed.folderPath) {
          setAssetsDownloadNotice({
            folderPath: parsed.folderPath,
            warnings: parsed.warnings ?? [],
          });
        }
      } catch {
        sessionStorage.removeItem(ASSETS_DOWNLOAD_STORAGE_KEY);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  async function runImport(answerOverrides?: Record<string, string>) {
    const trimmed = url.trim();
    if (!trimmed) {
      setError("لینک رویداد را وارد کنید.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const mergedAnswers = { ...answers, ...answerOverrides };
      const response = await fetch("/api/admin/events/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed, answers: mergedAnswers }),
      });

      const data = (await response.json()) as ImportResult & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "خطا در استخراج");

      setResult(data);
      if (answerOverrides) setAnswers(mergedAnswers);

      if (data.questions.length === 0) {
        // ready to apply
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در استخراج");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  function handleAnswerChange(question: ImportQuestion, value: string) {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
  }

  const sessionCount = (result?.draft.days ?? []).reduce(
    (n, d) => n + (d.sessions?.length ?? 0),
    0
  );

  return (
    <div className="mb-8 rounded-3xl border border-blue-200 bg-linear-to-br from-blue-50 to-indigo-50 p-5 dark:border-blue-500/30 dark:from-blue-500/10 dark:to-indigo-500/10">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">
          import از لینک فروش بلیت
        </h2>
      </div>
      {assetsDownloadNotice ? (
        <div className="mb-4 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-200">
          <p className="font-bold">تصاویر در پوشه دسکتاپ ذخیره شد:</p>
          <p className="mt-1 font-mono text-xs" dir="ltr">
            {assetsDownloadNotice.folderPath}
          </p>
          {assetsDownloadNotice.warnings.length > 0 ? (
            <ul className="mt-2 space-y-1 text-xs">
              {assetsDownloadNotice.warnings.map((warning, index) => (
                <li key={`${index}-${warning}`}>• {warning}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          لینک رویداد از هنر تیکت یا تیوال را وارد کنید. فیلدهای فرم پر می‌شوند و لینک خرید هر سانس
          به صفحه مبدأ اشاره می‌کند.
        </p>
        <Link
          href="/admin/events/discover"
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-blue-300 bg-white px-4 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-50 dark:border-blue-500/40 dark:bg-slate-900 dark:text-blue-300 dark:hover:bg-blue-500/10"
        >
          <SearchCheck className="h-4 w-4" />
          رویدادهای ثبت‌نشده
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-0 flex-1">
          <Link2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="url"
            dir="ltr"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.honarticket.com/macan185 یا https://www.tiwall.com/p/..."
            className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-4 pr-10 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={() => void runImport()}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-500 disabled:opacity-60"
        >
          <span className="inline-flex min-w-32 items-center justify-center gap-2">
            <Loader2
              className={`h-4 w-4 shrink-0 ${loading ? "animate-spin opacity-100" : "opacity-0"}`}
              aria-hidden
            />
            <span>{loading ? "در حال استخراج..." : "استخراج اطلاعات"}</span>
          </span>
        </button>
      </div>

      {error ? (
        <p className="mt-3 text-sm font-bold text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      {result ? (
        <div className="mt-5 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-blue-100 px-3 py-1 font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
              منبع: {PROVIDER_LABELS[result.provider] ?? result.provider}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              اطمینان: {result.confidence.toLocaleString("fa-IR")}٪
            </span>
            <span className="font-mono text-slate-400" dir="ltr">
              {result.sourceUrl}
            </span>
          </div>

          {result.warnings.length > 0 ? (
            <ul className="space-y-1 text-xs text-amber-700 dark:text-amber-300">
              {result.warnings.map((w, index) => (
                <li key={`${index}-${w}`}>• {w}</li>
              ))}
            </ul>
          ) : null}

          {result.questions.length > 0 ? (
            <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/30 dark:bg-amber-500/10">
              <p className="text-sm font-bold text-amber-800 dark:text-amber-200">
                برای تکمیل import، این موارد را مشخص کنید:
              </p>
              {result.questions.map((q) => (
                <div key={q.id}>
                  <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300">
                    {q.label}
                  </label>
                  <select
                    value={answers[q.id] ?? ""}
                    onChange={(e) => handleAnswerChange(q, e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="">انتخاب کنید...</option>
                    {q.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              <button
                type="button"
                disabled={loading || result.questions.some((q) => !answers[q.id])}
                onClick={() => void runImport(answers)}
                className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                اعمال پاسخ‌ها و به‌روزرسانی پیش‌نمایش
              </button>
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-bold text-slate-500 dark:text-slate-400">عنوان: </span>
                {result.draft.title || "—"}
              </p>
              <p>
                <span className="font-bold text-slate-500 dark:text-slate-400">شهر: </span>
                {result.draft.city || "—"}
              </p>
              <p>
                <span className="font-bold text-slate-500 dark:text-slate-400">دسته: </span>
                {result.draft.category || "—"}
              </p>
              <p>
                <span className="font-bold text-slate-500 dark:text-slate-400">محل برگزاری: </span>
                {result.draft.place || "—"}
              </p>
              <p>
                <span className="font-bold text-slate-500 dark:text-slate-400">نشانی: </span>
                {result.draft.placeAddress || "—"}
              </p>
              <p>
                <span className="font-bold text-slate-500 dark:text-slate-400">قیمت: </span>
                {result.draft.price || "—"}
              </p>
              <p>
                <span className="font-bold text-slate-500 dark:text-slate-400">سانس‌ها: </span>
                {sessionCount.toLocaleString("fa-IR")} سانس در{" "}
                {(result.draft.days ?? []).length.toLocaleString("fa-IR")} روز
              </p>
            </div>
            {result.draft.image ? (
              <EventImagePreviews
                imageUrl={result.draft.image}
                title={result.draft.title || "رویداد"}
              />
            ) : null}
          </div>

          <button
            type="button"
            disabled={result.questions.length > 0}
            onClick={() => onApply(result.draft)}
            className="w-full rounded-xl bg-brand-600 py-3 text-sm font-black text-white hover:bg-brand-500 disabled:opacity-50"
          >
            اعمال به فرم ثبت رویداد
          </button>
          {result.questions.length > 0 ? (
            <p className="text-center text-xs text-slate-500 dark:text-slate-400">
              ابتدا سوالات بالا را پاسخ دهید.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
