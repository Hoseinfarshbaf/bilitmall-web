import { CalendarDays, MapPin, Clock, ArrowRight, Tag } from "lucide-react";
import { events } from "@/data/events";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = events.find((e) => e.id === Number(id));

  if (!event) return notFound();

  return (
    <main className="min-h-screen bg-neutral-100" dir="rtl">
      
      {/* هدر کوچک */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-neutral-600 hover:text-red-600 transition font-bold text-sm"
          >
            <ArrowRight className="h-4 w-4" />
            بازگشت
          </Link>
          <span className="text-neutral-300">|</span>
          <span className="text-sm font-black text-neutral-900 line-clamp-1">
            {event.title}
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* کارت اصلی */}
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          
          {/* بنر رنگی کوچک */}
          <div className="h-32 bg-[linear-gradient(135deg,#111827_0%,#dc2626_100%)] relative">
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              <span className="rounded-full bg-white/20 backdrop-blur px-3 py-1 text-xs font-bold text-white">
                {event.category}
              </span>
              {event.badge && (
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-neutral-900">
                  {event.badge}
                </span>
              )}
            </div>
          </div>

          <div className="p-6">
            <h1 className="text-xl font-black text-neutral-900 mb-5">
              {event.title}
            </h1>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-neutral-600">
                <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                  <CalendarDays className="h-4 w-4 text-red-500" />
                </div>
                <span>{event.date}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-neutral-600">
                <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                  <Clock className="h-4 w-4 text-red-500" />
                </div>
                <span>{event.time}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-neutral-600">
                <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                  <MapPin className="h-4 w-4 text-red-500" />
                </div>
                <span>{event.place} — {event.city}</span>
              </div>
            </div>
          </div>
        </div>

        {/* کارت خرید */}
        <div className="bg-white rounded-3xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Tag className="h-4 w-4 text-red-500" />
            <h2 className="text-base font-black text-neutral-900">خرید بلیط</h2>
          </div>

          <div className="flex items-center justify-between bg-neutral-50 rounded-2xl px-4 py-3 mb-4">
            <span className="text-neutral-500 text-sm font-bold">قیمت</span>
            <span className="text-lg font-black text-red-600">{event.price}</span>
          </div>

          <button className="w-full bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black py-4 rounded-2xl transition-all text-base">
            خرید بلیط
          </button>
        </div>

      </div>
    </main>
  );
}