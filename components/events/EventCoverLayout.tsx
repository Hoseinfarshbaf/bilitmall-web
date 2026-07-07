"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getEventBannerImageStyle } from "@/lib/events/helpers";

type EventCoverLayoutProps = {
  coverImage: string;
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  variant?: "bilitmall" | "organizer";
  children: React.ReactNode;
};

const accent = {
  bilitmall: "text-red-400",
  organizer: "text-emerald-400",
};

export default function EventCoverLayout({
  coverImage,
  title,
  subtitle,
  backHref,
  backLabel = "بازگشت",
  variant = "bilitmall",
  children,
}: EventCoverLayoutProps) {
  const coverStyle = getEventBannerImageStyle(coverImage);

  return (
    <main className="relative min-h-screen text-white" dir="rtl">
      <div className="fixed inset-0 -z-10" style={coverStyle}>
        <div className="absolute inset-0 bg-black/65" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/55 to-[#0a0a0a]" />
      </div>

      <div className="relative z-10 mx-auto min-h-screen max-w-2xl px-4 pb-12 pt-5">
        {backHref ? (
          <Link
            href={backHref}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-4 py-2 text-sm font-bold text-white/90 backdrop-blur transition hover:bg-black/50"
          >
            <ArrowRight className="h-4 w-4" />
            {backLabel}
          </Link>
        ) : null}

        <header className="mb-6">
          <p className={`text-xs font-bold uppercase tracking-wider ${accent[variant]}`}>
            خرید بلیت
          </p>
          <h1 className="mt-1 text-2xl font-black leading-tight sm:text-3xl">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm text-white/70">{subtitle}</p> : null}
        </header>

        {children}
      </div>
    </main>
  );
}
