const events = [
  {
    id: 1,
    title: "کنسرت موسیقی سنتی",
    city: "تهران",
    date: "۲۵ تیر ۱۴۰۵",
    price: "۴۵۰,۰۰۰ تومان",
  },
  {
    id: 2,
    title: "همایش بازاریابی دیجیتال",
    city: "اصفهان",
    date: "۱۲ مرداد ۱۴۰۵",
    price: "۳۲۰,۰۰۰ تومان",
  },
  {
    id: 3,
    title: "جشنواره فیلم کوتاه",
    city: "شیراز",
    date: "۵ شهریور ۱۴۰۵",
    price: "۱۸۰,۰۰۰ تومان",
  },
];

export default function EventsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">رویدادها</h1>
            <p className="mt-2 text-slate-600">
              بلیت رویداد موردنظر خود را انتخاب و خریداری کنید.
            </p>
          </div>

          <a
            href="/"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-white"
          >
            بازگشت
          </a>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {events.map((event) => (
            <article
              key={event.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-4 h-40 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600" />

              <h2 className="mb-3 text-xl font-bold">{event.title}</h2>

              <div className="space-y-2 text-sm text-slate-600">
                <p>شهر: {event.city}</p>
                <p>تاریخ: {event.date}</p>
                <p>قیمت شروع: {event.price}</p>
              </div>

              <a
                href={`/events/${event.id}`}
                className="mt-5 block rounded-xl bg-blue-600 px-4 py-3 text-center text-white hover:bg-blue-700"
              >
                مشاهده و خرید بلیت
              </a>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
