"use client";

import Link from "next/link";
import { Ticket } from "lucide-react";

export default function AccountShell({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-neutral-50" dir="rtl">
      <div className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Ticket className="h-6 w-6 text-brand-600" />
            <div>
              <p className="text-xs font-bold text-neutral-500">حساب کاربری</p>
              {title ? (
                <h1 className="text-lg font-black text-neutral-900">{title}</h1>
              ) : (
                <h1 className="text-lg font-black text-neutral-900">بلیت‌مال</h1>
              )}
            </div>
          </div>
          <Link href="/" className="text-sm font-bold text-neutral-600 hover:text-brand-600">
            بازگشت به سایت
          </Link>
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>
    </div>
  );
}
