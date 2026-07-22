"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/account", label: "بلیت‌های من" },
  { href: "/account/favorites", label: "علاقه‌مندی‌ها" },
  { href: "/account/payments", label: "پرداخت‌ها" },
  { href: "/account/profile", label: "ویرایش حساب" },
];

export default function AccountNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-8 flex flex-wrap gap-2 border-b border-neutral-200 pb-4">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              active
                ? "bg-gray-900 text-white"
                : "bg-white text-neutral-600 ring-1 ring-neutral-200 hover:text-brand-600"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
