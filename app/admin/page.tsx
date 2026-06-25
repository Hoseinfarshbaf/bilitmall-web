export default function AdminPage() {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-5">
        <section className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">پنل مدیریت</h1>
              <p className="mt-2 text-slate-600">
              </p>
            </div>
  
            <a
              href="/"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm"
            >
              مشاهده سایت
            </a>
          </div>
  
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-2 text-xl font-bold">رویدادها</h2>
              <p className="mb-4 text-slate-600">ساخت و مدیریت رویدادها</p>
              <a
                href="/admin/events"
                className="inline-block rounded-xl bg-blue-600 px-4 py-3 text-white"
              >
                مدیریت رویدادها
              </a>
            </div>
  
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-2 text-xl font-bold">سفارش‌ها</h2>
              <p className="mb-4 text-slate-600">مشاهده خریدهای کاربران</p>
              <a
                href="/admin/orders"
                className="inline-block rounded-xl bg-blue-600 px-4 py-3 text-white"
              >
                مشاهده سفارش‌ها
              </a>
            </div>
  
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-2 text-xl font-bold">گزارش فروش</h2>
              <p className="mb-4 text-slate-600">تحلیل درآمد و تعداد فروش</p>
              <a
                href="/admin/reports"
                className="inline-block rounded-xl bg-blue-600 px-4 py-3 text-white"
              >
                گزارش‌ها
              </a>
            </div>
          </div>
        </section>
      </main>
    );
  }
  