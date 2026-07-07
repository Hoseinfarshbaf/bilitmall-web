import Link from "next/link";
import { Ticket, Mail, Phone, MapPin, Headset } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-neutral-200 bg-white" dir="rtl">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 text-xl font-black text-red-600">
              <Ticket className="h-7 w-7" />
              <span>بلیت‌مال</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-7 text-neutral-500">
              خرید آنلاین بلیت کنسرت، تئاتر و رویداد در سراسر ایران — سریع، امن و مطمئن.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-black text-neutral-900">دسته‌بندی‌ها</h3>
            <ul className="space-y-3 text-sm text-neutral-600">
              <li>
                <Link href="/events/تهران/کنسرت" className="transition hover:text-red-600">
                  کنسرت
                </Link>
              </li>
              <li>
                <Link href="/events/تهران/تئاتر" className="transition hover:text-red-600">
                  تئاتر
                </Link>
              </li>
              <li>
                <Link href="/events/تهران/ایونت" className="transition hover:text-red-600">
                  ایونت
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-black text-neutral-900">حساب کاربری</h3>
            <ul className="space-y-3 text-sm text-neutral-600">
              <li>
                <Link href="/auth/login" className="transition hover:text-red-600">
                  ورود
                </Link>
              </li>
              <li>
                <Link href="/auth/register" className="transition hover:text-red-600">
                  ثبت‌نام
                </Link>
              </li>
              <li>
                <Link href="/account" className="transition hover:text-red-600">
                  پنل کاربری
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-black text-neutral-900">تماس با ما</h3>
            <ul className="space-y-3 text-sm text-neutral-600">
              <li>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 font-bold text-neutral-700 transition hover:text-red-600"
                >
                  <Headset className="h-4 w-4 shrink-0 text-red-500" />
                  تماس و پشتیبانی
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-red-500" />
                <span dir="ltr">021-91000000</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-red-500" />
                <span dir="ltr">support@bilitmall.com</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <span>تهران، ایران</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-neutral-100 pt-8 sm:flex-row">
          <p className="text-xs text-neutral-400">
            © {year} بلیت‌مال. تمامی حقوق محفوظ است.
          </p>
          <p className="text-xs text-neutral-400">
            برگزارکننده هستید؟{" "}
            <Link href="/my-event" className="font-bold text-neutral-600 hover:text-red-600">
              My Event Studio
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
