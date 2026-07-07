import type { Metadata } from "next";
import Link from "next/link";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Headset,
  Ticket,
  Handshake,
  MessageCircle,
  Camera,
  Send,
  ArrowLeft,
} from "lucide-react";

export const metadata: Metadata = {
  title: "تماس و پشتیبانی | بلیت‌مال",
  description:
    "راه‌های ارتباط با بلیت‌مال برای خریداران بلیت و برگزارکنندگانی که خواهان همکاری هستند.",
};

const CHANNELS = [
  {
    icon: Phone,
    label: "تلفن پشتیبانی",
    value: "021-91000000",
    href: "tel:02191000000",
    ltr: true,
  },
  {
    icon: Mail,
    label: "ایمیل",
    value: "support@bilitmall.com",
    href: "mailto:support@bilitmall.com",
    ltr: true,
  },
  {
    icon: MapPin,
    label: "نشانی دفتر",
    value: "تهران، ایران",
    href: null,
    ltr: false,
  },
  {
    icon: Clock,
    label: "ساعات پاسخگویی",
    value: "شنبه تا پنج‌شنبه، ۹ تا ۱۸",
    href: null,
    ltr: false,
  },
];

const SOCIALS = [
  { icon: Camera, label: "اینستاگرام", href: "https://instagram.com" },
  { icon: Send, label: "تلگرام", href: "https://telegram.org" },
  { icon: MessageCircle, label: "واتساپ", href: "https://wa.me/" },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-neutral-50 pb-20" dir="rtl">
      {/* Hero */}
      <section className="bg-linear-to-b from-white to-neutral-50">
        <div className="mx-auto max-w-6xl px-4 py-14 text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-1.5 text-sm font-bold text-red-600">
            <Headset className="h-4 w-4" />
            همیشه کنار شما هستیم
          </span>
          <h1 className="text-3xl font-black text-neutral-900 sm:text-4xl">
            تماس و پشتیبانی
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-8 text-neutral-500 sm:text-base">
            چه به‌دنبال خرید بلیت هستید و چه برگزارکننده‌ای که می‌خواهد رویدادش را روی
            بلیت‌مال ارائه دهد، تیم ما آماده پاسخگویی است. کافی است از یکی از راه‌های
            زیر با ما در ارتباط باشید.
          </p>
        </div>
      </section>

      {/* Two audiences */}
      <section className="mx-auto max-w-6xl px-4">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Buyers */}
          <div className="flex flex-col rounded-3xl border border-neutral-200 bg-white p-7 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <Ticket className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-xl font-black text-neutral-900">
              خریداران بلیت
            </h2>
            <p className="mt-3 flex-1 text-sm leading-7 text-neutral-500">
              سوالی درباره خرید بلیت، استرداد وجه، ورود به حساب یا وضعیت سفارش دارید؟
              کارشناسان پشتیبانی ما در سریع‌ترین زمان پاسخگوی شما هستند.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="tel:02191000000"
                className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-black"
              >
                <Phone className="h-4 w-4" />
                تماس با پشتیبانی
              </a>
              <Link
                href="/account"
                className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-5 py-2.5 text-sm font-bold text-neutral-700 transition hover:border-red-200 hover:text-red-600"
              >
                پیگیری سفارش‌ها
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Organizers */}
          <div className="flex flex-col rounded-3xl border border-red-100 bg-linear-to-b from-red-50/60 to-white p-7 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600 text-white">
              <Handshake className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-xl font-black text-neutral-900">
              برگزارکنندگان و همکاری
            </h2>
            <p className="mt-3 flex-1 text-sm leading-7 text-neutral-500">
              رویداد، کنسرت یا نمایشی برگزار می‌کنید و می‌خواهید بلیت‌ها را روی بلیت‌مال
              بفروشید؟ با ساخت صفحه اختصاصی در My Event Studio یا تماس با تیم همکاری،
              رویدادتان را به هزاران مخاطب برسانید.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/my-event"
                className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
              >
                <Handshake className="h-4 w-4" />
                شروع همکاری
              </Link>
              <a
                href="mailto:partners@bilitmall.com"
                className="inline-flex items-center gap-2 rounded-full border border-red-200 px-5 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50"
              >
                <Mail className="h-4 w-4" />
                partners@bilitmall.com
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Channels */}
      <section className="mx-auto max-w-6xl px-4 pt-12">
        <h2 className="mb-6 text-lg font-black text-neutral-900">راه‌های ارتباطی</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CHANNELS.map((channel) => {
            const Icon = channel.icon;
            const content = (
              <div className="flex h-full items-start gap-3 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-red-200 hover:shadow-md">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-400">{channel.label}</p>
                  <p
                    className="mt-1 text-sm font-bold text-neutral-800"
                    dir={channel.ltr ? "ltr" : "rtl"}
                  >
                    {channel.value}
                  </p>
                </div>
              </div>
            );

            return channel.href ? (
              <a key={channel.label} href={channel.href} className="block h-full">
                {content}
              </a>
            ) : (
              <div key={channel.label} className="h-full">
                {content}
              </div>
            );
          })}
        </div>
      </section>

      {/* Socials */}
      <section className="mx-auto max-w-6xl px-4 pt-12">
        <div className="flex flex-col items-center justify-between gap-6 rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-sm sm:flex-row sm:text-right">
          <div>
            <h2 className="text-lg font-black text-neutral-900">
              ما را در شبکه‌های اجتماعی دنبال کنید
            </h2>
            <p className="mt-2 text-sm text-neutral-500">
              از جدیدترین رویدادها و تخفیف‌ها باخبر شوید.
            </p>
          </div>
          <div className="flex gap-3">
            {SOCIALS.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  title={social.label}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                >
                  <Icon className="h-5 w-5" />
                </a>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
