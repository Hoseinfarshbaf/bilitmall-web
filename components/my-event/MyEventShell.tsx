"use client";

import { MY_EVENT_BRAND } from "@/lib/my-event/constants";
import MyEventHeader from "@/components/my-event/MyEventHeader";

export default function MyEventShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <div className="min-h-screen bg-[#0a1210] text-white" dir="rtl">
      <MyEventHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        {title ? <h1 className="mb-8 text-3xl font-black text-white">{title}</h1> : null}
        {children}
      </main>
      <footer className="border-t border-white/5 py-6 text-center text-xs text-slate-500">
        {MY_EVENT_BRAND} — متصل به بلیت‌مال
      </footer>
    </div>
  );
}
