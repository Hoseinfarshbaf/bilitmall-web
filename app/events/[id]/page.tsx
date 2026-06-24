type EventDetailsPageProps = {
    params: Promise<{
      id: string;
    }>;
  };
  
  const events = [
    {
      id: "1",
      title: "کنسرت موسیقی سنتی",
      city: "تهران",
      venue: "تالار وحدت",
      date: "۲۵ تیر ۱۴۰۵",
      time: "۲۰:۳۰",
      description:
        "یک شب خاطره‌انگیز با اجرای زنده موسیقی سنتی ایرانی همراه با گروهی از هنرمندان برجسته.",
      tickets: [
        { id: 1, title: "جایگاه معمولی", price: "۴۵۰,۰۰۰ تومان" },
        { id: 2, title: "جایگاه ویژه", price: "۷۵۰,۰۰۰ تومان" },
      ],
    },
    {
      id: "2",
      title: "همایش بازاریابی دیجیتال",
      city: "اصفهان",
      venue: "مرکز همایش‌های بین‌المللی",
      date: "۱۲ مرداد ۱۴۰۵",
      time: "۱۰:۰۰",
      description:
        "همایشی تخصصی برای صاحبان کسب‌وکار، مارکترها و علاقه‌مندان به رشد آنلاین.",
      tickets: [
        { id: 1, title: "شرکت‌کننده عادی", price: "۳۲۰,۰۰۰ تومان" },
        { id: 2, title: "VIP", price: "۶۵۰,۰۰۰ تومان" },
      ],
    },
    {
      id: "3",
      title: "جشنواره فیلم کوتاه",
      city: "شیراز",
      venue: "سینما فرهنگ",
      date: "۵ شهریور ۱۴۰۵",
      time: "۱۸:۰۰",
      description:
        "نمایش مجموعه‌ای از فیلم‌های کوتاه منتخب همراه با نشست نقد و بررسی.",
      tickets: [
        { id: 1, title: "بلیت عادی", price: "۱۸۰,۰۰۰ تومان" },
        { id: 2, title: "بلیت کامل جشنواره", price: "۴۹۰,۰۰۰ تومان" },
      ],
    },
  ];
  
  export default async function EventDetailsPage({
    params,
  }: EventDetailsPageProps) {
    const { id } = await params;
  
    const event = events.find((item) => item.id === id);
  
    if (!event) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <h1 className="mb-4 text-2xl font-bold">رویداد پیدا نشد</h1>
            <a href="/events" className="text-blue-600">
              بازگشت به رویدادها
            </a>
          </div>
        </main>
      );
    }
  
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <section className="mx-auto max-w-5xl">
          <a href="/events" className="mb-6 inline-block text-blue-600">
            بازگشت به رویدادها
          </a>
  
          <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
            <div className="h-72 bg-gradient-to-br from-blue-500 to-indigo-700" />
  
            <div className="p-6 md:p-8">
              <h1 className="mb-4 text-3xl font-bold">{event.title}</h1>
  
              <div className="mb-6 grid gap-3 text-slate-600 md:grid-cols-2">
                <p>شهر: {event.city}</p>
                <p>محل برگزاری: {event.venue}</p>
                <p>تاریخ: {event.date}</p>
                <p>ساعت: {event.time}</p>
              </div>
  
              <p className="mb-8 leading-8 text-slate-700">
                {event.description}
              </p>
  
              <h2 className="mb-4 text-2xl font-bold">انتخاب بلیت</h2>
  
              <div className="space-y-4">
                {event.tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 p-4"
                  >
                    <div>
                      <h3 className="font-bold">{ticket.title}</h3>
                      <p className="mt-1 text-slate-600">{ticket.price}</p>
                    </div>
  
                    <button className="rounded-xl bg-green-600 px-5 py-3 text-white hover:bg-green-700">
                      خرید بلیت
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }
  