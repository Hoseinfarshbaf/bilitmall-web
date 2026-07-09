"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, Loader2, RefreshCw, SearchCheck } from "lucide-react";
import { adminTableClasses } from "@/components/admin/admin-table-classes";
import type {
  DiscoveryProviderId,
  DiscoveryScanResult,
  ProviderDiscoveryResult,
} from "@/lib/events/discovery/types";

const PROVIDER_LABELS: Record<DiscoveryProviderId, string> = {
  honarticket: "هنر تیکت",
  melotik: "ملوتیک",
};

const ASSETS_DOWNLOAD_STORAGE_KEY = "event-assets-download";

function navigateToCreateEvent(eventUrl: string) {
  const target = `/admin/events?create=1&importUrl=${encodeURIComponent(eventUrl)}`;
  window.location.assign(target);
}

function formatScanTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("fa-IR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export default function AdminEventDiscoveryPage() {
  const [activeProvider, setActiveProvider] = useState<DiscoveryProviderId>("honarticket");
  const [scan, setScan] = useState<DiscoveryScanResult | null>(null);
  const [loadingProvider, setLoadingProvider] = useState<DiscoveryProviderId | null>(null);
  const [registeringUrl, setRegisteringUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  const runScan = useCallback(
    async (provider: DiscoveryProviderId, refresh = false) => {
      setLoadingProvider(provider);
      setError("");

      try {
        const response = await fetch("/api/admin/events/discover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider, refresh, unregisteredOnly: true }),
        });

        const data = (await response.json()) as DiscoveryScanResult & { error?: string };
        if (!response.ok) throw new Error(data.error ?? "خطا در اسکن");

        setScan((prev) => {
          if (!prev) return data;
          const merged = new Map(prev.providers.map((p) => [p.provider, p]));
          for (const p of data.providers) merged.set(p.provider, p);
          return {
            scannedAt: data.scannedAt,
            fromCache: data.fromCache,
            providers: [...merged.values()],
          };
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "خطا در اسکن");
      } finally {
        setLoadingProvider(null);
      }
    },
    []
  );

  const handleRegister = useCallback(
    async (eventUrl: string, title: string, cardImageUrl?: string) => {
      setRegisteringUrl(eventUrl);
      setError("");

      try {
        const response = await fetch("/api/admin/events/download-assets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: eventUrl, title, cardImageUrl }),
        });

        const data = (await response.json()) as {
          error?: string;
          folderPath?: string;
          warnings?: string[];
        };

        if (!response.ok) {
          throw new Error(data.error ?? "خطا در دانلود تصاویر");
        }

        sessionStorage.setItem(
          ASSETS_DOWNLOAD_STORAGE_KEY,
          JSON.stringify({
            folderPath: data.folderPath ?? "",
            warnings: data.warnings ?? [],
          })
        );
        navigateToCreateEvent(eventUrl);
      } catch (err) {
        const message = err instanceof Error ? err.message : "خطا در دانلود تصاویر";
        const proceed = window.confirm(
          `${message}\n\nبدون دانلود تصاویر به فرم ثبت رویداد بروید؟`
        );
        if (proceed) {
          navigateToCreateEvent(eventUrl);
        } else {
          setRegisteringUrl(null);
        }
      }
    },
    []
  );

  useEffect(() => {
    void runScan(activeProvider, false);
  }, [activeProvider, runScan]);

  const providerResult: ProviderDiscoveryResult | undefined = useMemo(
    () => scan?.providers.find((p) => p.provider === activeProvider),
    [scan, activeProvider]
  );

  const events = providerResult?.events ?? [];
  const isLoading = loadingProvider === activeProvider;

  return (
    <main
      className="min-h-screen bg-slate-50 p-4 text-slate-900 md:p-8 dark:bg-slate-950 dark:text-slate-100"
      dir="rtl"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <Link
            href="/admin/events?create=1"
            className="mb-2 inline-block text-sm font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            ← بازگشت به ثبت رویداد
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="flex items-center gap-2 text-3xl font-black text-slate-800 dark:text-slate-100">
                <SearchCheck className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                رویدادهای ثبت‌نشده
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-400">
                فقط رویدادهایی که الان روی سایت فروشنده فعال و قابل خرید هستند و هنوز در بلیت‌مال
                ثبت نشده‌اند (نه آرشیو و نه جدول جشنواره).
              </p>
            </div>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {(Object.keys(PROVIDER_LABELS) as DiscoveryProviderId[]).map((id) => {
            const result = scan?.providers.find((p) => p.provider === id);
            const count = result?.unregisteredCount;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveProvider(id)}
                className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                  activeProvider === id
                    ? "bg-blue-600 text-white"
                    : "border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                }`}
              >
                {PROVIDER_LABELS[id]}
                {typeof count === "number" ? (
                  <span className="mr-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                    {count.toLocaleString("fa-IR")}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-sm text-slate-600 dark:text-slate-300">
            {providerResult?.scannedAt ? (
              <>
                آخرین اسکن:{" "}
                <span className="font-bold">{formatScanTime(providerResult.scannedAt)}</span>
                {providerResult.fromCache ? (
                  <span className="mr-2 text-xs text-amber-600 dark:text-amber-400">(از حافظه موقت)</span>
                ) : null}
              </>
            ) : (
              "هنوز اسکن نشده"
            )}
            {providerResult?.status === "error" ? (
              <p className="mt-1 text-red-600 dark:text-red-400">{providerResult.error}</p>
            ) : null}
          </div>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => void runScan(activeProvider, true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            تازه‌سازی {PROVIDER_LABELS[activeProvider]}
          </button>
        </div>

        {error ? (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </p>
        ) : null}

        <div className={adminTableClasses.panel}>
          {isLoading && events.length === 0 ? (
            <p className={adminTableClasses.emptyInPanel}>در حال اسکن {PROVIDER_LABELS[activeProvider]}...</p>
          ) : providerResult?.status === "error" && events.length === 0 ? (
            <p className={adminTableClasses.emptyInPanel}>
              اسکن ناموفق بود. دکمه تازه‌سازی را بزنید یا بعداً دوباره تلاش کنید.
            </p>
          ) : events.length === 0 ? (
            <p className={adminTableClasses.emptyInPanel}>
              رویداد ثبت‌نشده‌ای در {PROVIDER_LABELS[activeProvider]} یافت نشد.
            </p>
          ) : (
            <div className={adminTableClasses.panelInner}>
              <table className={adminTableClasses.table}>
                <thead className={adminTableClasses.thead}>
                  <tr>
                    <th className={adminTableClasses.th}>رویداد</th>
                    <th className={adminTableClasses.th}>شهر / مکان</th>
                    <th className={adminTableClasses.th}>تاریخ</th>
                    <th className={adminTableClasses.th}>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.url} className={adminTableClasses.tr}>
                      <td className={adminTableClasses.td}>
                        <div className="font-bold text-slate-800 dark:text-slate-100">{event.title}</div>
                        <a
                          href={event.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
                          dir="ltr"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {event.url.replace(/^https?:\/\/(www\.)?/, "")}
                        </a>
                      </td>
                      <td className={adminTableClasses.td}>
                        <div>{event.city ?? "—"}</div>
                        {event.place ? (
                          <div className="text-xs text-slate-500 dark:text-slate-400">{event.place}</div>
                        ) : null}
                      </td>
                      <td className={adminTableClasses.td}>{event.dateHint ?? "—"}</td>
                      <td className={adminTableClasses.td}>
                        <button
                          type="button"
                          disabled={registeringUrl === event.url}
                          onClick={() =>
                            void handleRegister(event.url, event.title, event.imageUrl)
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                          {registeringUrl === event.url ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              در حال دانلود...
                            </>
                          ) : (
                            "ثبت در بلیت‌مال"
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
