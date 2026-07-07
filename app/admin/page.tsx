export default function AdminPage() {
  return (
    <main
      className="min-h-screen bg-slate-100 px-4 py-5 text-slate-900 dark:bg-slate-950 dark:text-slate-100"
      dir="rtl"
    >
      <section className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">پنل مدیریت بلیت‌مال</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              مدیریت رویدادها، کاربران، سفارش‌ها و برگزارکنندگان My Event
            </p>
          </div>

          <a
            href="/"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            مشاهده سایت
          </a>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-2 text-xl font-bold">رویدادهای بلیت‌مال</h2>
            <p className="mb-4 text-slate-600 dark:text-slate-400">ساخت و مدیریت رویدادهای مارکت‌پلیس</p>
            <a
              href="/admin/events"
              className="inline-block rounded-xl bg-blue-600 px-4 py-3 text-white"
            >
              مدیریت رویدادها
            </a>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-2 text-xl font-bold">کاربران بلیت‌مال</h2>
            <p className="mb-4 text-slate-600 dark:text-slate-400">خریداران ثبت‌نام‌شده در سایت</p>
            <a
              href="/admin/users"
              className="inline-block rounded-xl bg-blue-600 px-4 py-3 text-white"
            >
              لیست کاربران
            </a>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-2 text-xl font-bold">سفارش‌ها</h2>
            <p className="mb-4 text-slate-600 dark:text-slate-400">بلیت‌ها و پرداخت‌های کاربران</p>
            <a
              href="/admin/orders"
              className="inline-block rounded-xl bg-blue-600 px-4 py-3 text-white"
            >
              مشاهده سفارش‌ها
            </a>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-2 text-xl font-bold">برگزارکنندگان My Event</h2>
            <p className="mb-4 text-slate-600 dark:text-slate-400">تأیید حساب برگزارکنندگان</p>
            <a
              href="/admin/my-event"
              className="inline-block rounded-xl bg-emerald-600 px-4 py-3 text-white"
            >
              مدیریت برگزارکنندگان
            </a>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-2 text-xl font-bold">رویدادهای My Event</h2>
            <p className="mb-4 text-slate-600 dark:text-slate-400">تأیید رویدادهای ثبت‌شده توسط برگزارکنندگان</p>
            <a
              href="/admin/my-event/events"
              className="inline-block rounded-xl bg-emerald-600 px-4 py-3 text-white"
            >
              رویدادهای در انتظار
            </a>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-2 text-xl font-bold">انتشار در بلیت‌مال</h2>
            <p className="mb-4 text-slate-600 dark:text-slate-400">درخواست‌های نمایش رویداد در مارکت‌پلیس</p>
            <a
              href="/admin/bilitmall-listings"
              className="inline-block rounded-xl bg-red-600 px-4 py-3 text-white"
            >
              درخواست‌های انتشار
            </a>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-2 text-xl font-bold">مدیریت شهرها</h2>
            <p className="mb-4 text-slate-600 dark:text-slate-400">افزودن، حذف و مشاهده شهرهای فعال در کل سیستم</p>
            <a
              href="/admin/cities"
              className="inline-block rounded-xl bg-sky-600 px-4 py-3 text-white"
            >
              مدیریت شهرها
            </a>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-2 text-xl font-bold">قالب‌های سالن</h2>
            <p className="mb-4 text-slate-600 dark:text-slate-400">تعریف سالن پیش‌فرض برای صندلی‌گذاری رویدادها</p>
            <a
              href="/admin/venue-templates"
              className="inline-block rounded-xl bg-violet-600 px-4 py-3 text-white"
            >
              مدیریت سالن‌ها
            </a>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-2 text-xl font-bold">استودیو برگزارکننده</h2>
            <p className="mb-4 text-slate-600 dark:text-slate-400">ورود برگزارکنندگان به پنل My Event</p>
            <a
              href="/my-event"
              className="inline-block rounded-xl bg-slate-800 px-4 py-3 text-white"
            >
              My Event Studio
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
