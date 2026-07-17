"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type AdminBackLinkProps = {
  href?: string;
  label?: string;
  className?: string;
};

export default function AdminBackLink({
  href = "/admin",
  label = "بازگشت به پنل ادمین",
  className,
}: AdminBackLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "mb-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-white",
        className
      )}
    >
      <ArrowRight className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" aria-hidden />
      <span>{label}</span>
    </Link>
  );
}
