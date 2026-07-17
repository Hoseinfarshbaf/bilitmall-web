"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, Loader2, RefreshCw, SearchCheck } from "lucide-react";
import AdminBackLink from "@/components/admin/AdminBackLink";
import { adminTableClasses } from "@/components/admin/admin-table-classes";
import type {
  DiscoveryProviderId,
  DiscoveryScanResult,
  ProviderDiscoveryResult,
} from "@/lib/events/discovery/types";

const PROVIDER_LABELS: Record<DiscoveryProviderId, string> = {
  honarticket: "هنر تیکت",
  tiwall: "تیوال",
};

const PROVIDER_HINTS: Record<DiscoveryProviderId, string> = {
  honarticket:
    "رویدادهای فعال و آینده در هنر تیکت که هنوز در بلیت‌مال ثبت نشده‌اند؛ شامل رویدادهای در حال فروش و فروش به‌زودی.",
  tiwall:
    "فقط رویدادهای محبوب و پرفروش تیوال با فروش باز، خرید مستقیم از تیوال، تاریخ و سانس و آدرس مشخص که هنوز برگزار نشده‌اند.",
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
  const [loadingProvider, setLoadingProvider] = useState<DiscoveryProviderId | null>("honarticket");
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
        if (!Array.isArray(data.providers)) {
          throw new Error("پاسخ سرور نامعتبر است.");
        }

        setScan((prev) => {
          if (!prev) return data;
          const merged = new Map((prev.providers ?? []).map((p) => [p.provider, p]));
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
    let cancelled = false;

    void fetch("/api/admin/events/discover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: activeProvider, refresh: false, unregisteredOnly: true }),
    })
      .then(async (response) => {
        if (cancelled) return;
        const data = (await response.json()) as DiscoveryScanResult & { error?: string };
        if (!response.ok) throw new Error(data.error ?? "خطا در اسکن");
        if (!Array.isArray(data.providers)) {
          throw new Error("پاسخ سرور نامعتبر است.");
        }

        setScan((prev) => {
          if (!prev) return data;
          const merged = new Map((prev.providers ?? []).map((p) => [p.provider, p]));
          for (const p of data.providers) merged.set(p.provider, p);
          return {
            scannedAt: data.scannedAt,
            fromCache: data.fromCache,
            providers: [...merged.values()],
          };
        });
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "خطا در اسکن");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingProvider(null);
      });

    return () => {
      cancelled = true;
    };
  }, [activeProvider]);

  const providerResult: ProviderDiscoveryResult | undefined = useMemo(
    () => scan?.providers.find((p) => p.provider === activeProvider),
    [scan, activeProvider]
  );

  const events = providerResult?.events ?? [];
  const isLoading = loadingProvider === activeProvider;
  const providerLabel = PROVIDER_LABELS[activeProvider];

  return (
    <main
      className="min-h-screen bg-slate-50 p-4 text-slate-900 md:p-8 dark:bg-slate-950 dark:text-slate-100"
      dir="rtl"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <div className="mb-3 flex flex-wrap gap-2">
            <AdminBackLink className="mb-0" />
            <AdminBackLink
              href="/admin/events?create=1"
              label="بازگشت به ثبت رویداد"
              className="mb-0"
            />
          </div>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="flex items-center gap-2 text-3xl font-black text-slate-800 dark:text-slate-100">
                <SearchCheck className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                رویدادهای ثبت‌نشده
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-400">
                {PROVIDER_HINTS[activeProvider]}
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
                onClick={() => {
                  setActiveProvider(id);
                  setLoadingProvider(id);
                  setError("");
                }}
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
                آخرین اسکن {providerLabel}:{" "}
                <span className="font-bold">{formatScanTime(providerResult.scannedAt)}</span>
                {providerResult.fromCache ? (
                  <span className="mr-2 text-xs text-amber-600 dark:text-amber-400">(از حافظه موقت)</span>
                ) : null}
                {typeof providerResult.unregisteredCount === "number" ? (
                  <span className="mr-2 text-xs font-bold text-blue-600 dark:text-blue-400">
                    {providerResult.unregisteredCount.toLocaleString("fa-IR")} رویداد ثبت‌نشده
                  </span>
                ) : null}
              </>
            ) : (
              `هنوز ${providerLabel} اسکن نشده`
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
            <span className="relative inline-flex h-4 w-4 shrink-0 items-center justify-center">
              <Loader2
                className={`absolute h-4 w-4 ${isLoading ? "animate-spin opacity-100" : "opacity-0"}`}
                aria-hidden={!isLoading}
              />
              <RefreshCw
                className={`absolute h-4 w-4 ${isLoading ? "opacity-0" : "opacity-100"}`}
                aria-hidden={isLoading}
              />
            </span>
            تازه‌سازی {providerLabel}
          </button>
        </div>

        {error ? (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </p>
        ) : null}

        <div className={adminTableClasses.panel}>
          {isLoading && events.length === 0 ? (
            <p className={adminTableClasses.emptyInPanel}>در حال اسکن {providerLabel}...</p>
          ) : providerResult?.status === "error" && events.length === 0 ? (
            <p className={adminTableClasses.emptyInPanel}>
              اسکن ناموفق بود. دکمه تازه‌سازی را بزنید یا بعداً دوباره تلاش کنید.
            </p>
          ) : events.length === 0 ? (
            <p className={adminTableClasses.emptyInPanel}>
              رویداد ثبت‌نشده‌ای در {providerLabel} یافت نشد.
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
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          {event.onSale === false ? (
                            <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                              {event.saleHint ?? "فروش به‌زودی"}
                            </span>
                          ) : null}
                          {typeof event.reviewCount === "number" && event.reviewCount > 0 ? (
                            <span className="inline-block rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-bold text-violet-800 dark:bg-violet-500/20 dark:text-violet-300">
                              {event.reviewCount.toLocaleString("fa-IR")} نظر
                              {typeof event.avgRating === "number"
                                ? ` · ${event.avgRating.toLocaleString("fa-IR")}★`
                                : ""}
                            </span>
                          ) : null}
                          {event.dateHint ? (
                            <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                              {event.dateHint}
                            </span>
                          ) : null}
                        </div>
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
                          <Loader2
                            className={`h-3.5 w-3.5 shrink-0 ${
                              registeringUrl === event.url
                                ? "animate-spin opacity-100"
                                : "opacity-0"
                            }`}
                            aria-hidden={registeringUrl !== event.url}
                          />
                          <span>
                            {registeringUrl === event.url
                              ? "در حال دانلود..."
                              : "ثبت در بلیت‌مال"}
                          </span>
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
