"use client";

import Link from "next/link";
import { useCity } from "@/components/CityContext";
import { Heart } from "lucide-react"; // حتما نصبش کن: npm install lucide-react
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const slides = [
  {
    title: "کنسرت بزرگ تابستان",
    subtitle: "خرید بلیت بهترین اجراهای موسیقی با جایگاه‌های متنوع",
    badge: "پیشنهاد ویژه",
    href: "/events/1",
    color: "bg-red-600",
  },
  {
    title: "همایش استارتاپ‌ها",
    subtitle: "فرصتی برای شبکه‌سازی، یادگیری و آشنایی با کسب‌وکارهای نو",
    badge: "ظرفیت محدود",
    href: "/events/2",
    color: "bg-blue-700",
  },
];

const events = [
  { id: 1, title: "کنسرت بزرگ تابستان", date: "۲۵ تیر - ۲۸ تیر", color: "bg-gray-800" },
  { id: 2, title: "همایش استارتاپ‌ها", date: "۱۰ مرداد", color: "bg-gray-700" },
  { id: 3, title: "فستیوال موسیقی سنتی", date: "۱۵ شهریور", color: "bg-gray-600" },
  { id: 4, title: "مسابقه فینال جام", date: "۲۰ مهر", color: "bg-gray-800" },
];

export default function Home() {
  const { selectedCity } = useCity();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      
      {/* بخش اسلایدر اصلی - کمی جمع‌وجورتر */}
      <section className="mb-12">
        <Carousel opts={{ direction: "rtl", align: "start", loop: true }} className="relative w-full">
          <CarouselContent>
            {slides.map((slide) => (
              <CarouselItem key={slide.title}>
                <div className={`relative overflow-hidden rounded-3xl ${slide.color} px-8 py-10 text-white shadow-lg md:px-12`}>
                  <div className="absolute left-6 top-6 rounded-full bg-white/20 px-3 py-1 text-xs backdrop-blur">
                    {slide.badge}
                  </div>
                  <div className="max-w-xl">
                    <h1 className="text-2xl font-black md:text-4xl">{slide.title}</h1>
                    <p className="mt-3 text-white/90">
                      {slide.subtitle} در <span className="font-bold underline">{selectedCity}</span>
                    </p>
                    <Link href={slide.href} className="mt-6 inline-block rounded-full bg-white px-6 py-2 text-sm font-bold text-gray-900 transition hover:bg-gray-100">
                      خرید بلیت
                    </Link>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-4 bg-white/80" />
          <CarouselNext className="right-4 bg-white/80" />
        </Carousel>
      </section>

      {/* بخش رویدادهای محبوب (StubHub Style) */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-black text-gray-900">رویدادهای محبوب در {selectedCity}</h2>
        </div>

        {/* گرید کارت‌ها */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="group block overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-lg"
            >
              {/* تصویر رویداد با آیکون قلب */}
              <div className={`relative h-60 w-full ${event.color} overflow-hidden`}>
                <button className="absolute right-3 top-3 rounded-full bg-white/20 p-2 text-white backdrop-blur transition hover:bg-white/40">
                  <Heart className="h-5 w-5" />
                </button>
              </div>

              {/* متن کارت */}
              <div className="p-4">
                <h3 className="font-bold text-gray-900 group-hover:text-red-600 transition-colors">
                  {event.title}
                </h3>
                <p className="mt-1 text-sm text-gray-500">{event.date}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
