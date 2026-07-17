import Link from "next/link";
import { ArrowLeft, CalendarPlus } from "lucide-react";

export default function OrganizerCta() {
  return (
    <section className="mx-auto mt-10 max-w-6xl px-4 md:mt-16">
      <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 px-5 py-7 sm:px-10 sm:py-10 md:rounded-3xl">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-red-600/20 blur-3xl"
        />
        <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/80">
              <CalendarPlus className="h-3.5 w-3.5 text-red-400" />
              ویژه برگزارکنندگان
            </span>
            <h2 className="mt-3 text-xl font-black text-white sm:text-2xl">
              رویداد خودت را برگزار می‌کنی؟
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-400">
              با استودیو My Event رویدادت را ثبت کن، بلیت بفروش و در بلیت‌مال منتشرش کن.
              رایگان و بدون واسطه.
            </p>
          </div>

          <Link
            href="/my-event"
            className="group inline-flex min-h-12 w-full shrink-0 items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-black text-neutral-900 transition-all hover:bg-red-600 hover:text-white sm:w-auto sm:min-h-0"
          >
            شروع کنید
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
