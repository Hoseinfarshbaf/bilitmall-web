"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ExternalLink, Moon, Sparkles, Sun } from "lucide-react";
import { MY_EVENT_STUDIO } from "@/lib/my-event/constants";
import { useMyEventTheme } from "@/components/my-event/MyEventThemeProvider";

function ThemeToggle() {
  const { theme, toggleTheme } = useMyEventTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "روشن کردن تم" : "تیره کردن تم"}
      title={isDark ? "تم روشن" : "تم تیره"}
      className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold text-neutral-600 transition-colors hover:bg-neutral-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
    >
      {isDark ? (
        <Sun className="h-3.5 w-3.5 text-amber-400" />
      ) : (
        <Moon className="h-3.5 w-3.5 text-brand-600" />
      )}
      <span className="hidden sm:inline">{isDark ? "روشن" : "تیره"}</span>
    </button>
  );
}

export default function MyEventHeader() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/my-event/me")
      .then((res) => setLoggedIn(res.ok))
      .catch(() => setLoggedIn(false));
  }, []);

  return (
    <header className="border-b border-neutral-200 bg-white/95 backdrop-blur dark:border-brand-500/10 dark:bg-[#0a1210]/95">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
        <Link
          href="/my-event"
          className="flex shrink-0 items-center gap-2 font-black text-neutral-900 dark:text-white"
        >
          <Sparkles className="h-6 w-6 text-brand-500 dark:text-brand-400" />
          <span>{MY_EVENT_STUDIO}</span>
        </Link>

        <nav className="flex flex-wrap items-center justify-end gap-2 text-sm font-bold sm:gap-3">
          {loggedIn === null ? (
            <span className="text-xs text-neutral-400 dark:text-slate-500">...</span>
          ) : loggedIn ? (
            <>
              <Link
                href="/my-event/dashboard"
                className="text-neutral-600 hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-300"
              >
                داشبورد
              </Link>
              <Link
                href="/my-event/profile"
                className="text-neutral-600 hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-300"
              >
                پروفایل
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/my-event/login"
                className="text-neutral-600 hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-300"
              >
                ورود
              </Link>
              <Link
                href="/my-event/register"
                className="rounded-full bg-brand-600 px-3 py-1.5 text-xs text-white hover:bg-brand-500"
              >
                ثبت‌نام
              </Link>
            </>
          )}

          <ThemeToggle />

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 hover:border-brand-500/40 hover:text-brand-600 dark:border-white/10 dark:text-slate-300 dark:hover:border-brand-500/30 dark:hover:text-brand-200"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">بازدید از سایت بلیت‌مال</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
