"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ExternalLink, Sparkles } from "lucide-react";
import { MY_EVENT_STUDIO } from "@/lib/my-event/constants";

export default function MyEventHeader() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/my-event/me")
      .then((res) => setLoggedIn(res.ok))
      .catch(() => setLoggedIn(false));
  }, []);

  return (
    <header className="border-b border-emerald-500/10 bg-[#0a1210]/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
        <Link href="/my-event" className="flex shrink-0 items-center gap-2 font-black text-white">
          <Sparkles className="h-6 w-6 text-emerald-400" />
          <span>{MY_EVENT_STUDIO}</span>
        </Link>

        <nav className="flex flex-wrap items-center justify-end gap-2 text-sm font-bold sm:gap-3">
          {loggedIn === null ? (
            <span className="text-xs text-slate-500">...</span>
          ) : loggedIn ? (
            <>
              <Link href="/my-event/dashboard" className="text-slate-300 hover:text-emerald-300">
                داشبورد
              </Link>
              <Link href="/my-event/profile" className="text-slate-300 hover:text-emerald-300">
                پروفایل
              </Link>
            </>
          ) : (
            <>
              <Link href="/my-event/login" className="text-slate-300 hover:text-emerald-300">
                ورود
              </Link>
              <Link
                href="/my-event/register"
                className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs text-white hover:bg-emerald-500"
              >
                ثبت‌نام
              </Link>
            </>
          )}

          <a
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:border-emerald-500/30 hover:text-emerald-200"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>بازدید از سایت بلیت‌مال</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
