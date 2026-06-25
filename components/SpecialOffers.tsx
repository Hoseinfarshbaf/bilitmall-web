// بنر پیشنهاد های ویژه 
export default function SpecialOffers() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-8">
      <div className="overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#111827_0%,#7f1d1d_45%,#ef4444_100%)] p-8 text-white shadow-lg">
        <div className="max-w-2xl">
          <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
            پیشنهادهای ویژه
          </span>
          <h2 className="mt-4 text-2xl font-black sm:text-4xl">
            بلیت رویدادهای داغ همین هفته
          </h2>
          <p className="mt-3 text-sm leading-6 text-white/85 sm:text-base">
            کنسرت‌ها، تئاترها و مسابقات محبوب را سریع پیدا کن و بلیتت را آنلاین بخر.
          </p>
        </div>
      </div>
    </section>
  );
}
