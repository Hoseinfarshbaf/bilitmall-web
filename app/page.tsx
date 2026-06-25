"use client";
import PopularEvents from "@/components/PopularEvents";
import SearchBar from "@/components/SearchBar";
import SpecialOffers from "@/components/SpecialOffers";
import CategorySlider from "@/components/CategorySlider";
import { events } from "@/data/events";
import { useCity } from "@/components/CityContext";


export default function Home() {
  const { selectedCity } = useCity();

  // فیلتر کردن رویدادها بر اساس شهر انتخاب شده
  const cityEvents = events.filter((event) => event.city === selectedCity);
  
  // اگر در شهر انتخابی رویدادی نبود، از تهران به عنوان fallback استفاده می‌کنیم (اختیاری)
  const displayEvents = cityEvents.length > 0 
    ? cityEvents 
    : events.filter(e => e.city === "تهران");

  // جداسازی بر اساس دسته‌بندی
  const concerts = displayEvents.filter((e) => e.category === "کنسرت");
  const theaters = displayEvents.filter((e) => e.category === "تئاتر");
  const sports = displayEvents.filter((e) => e.category === " ورزشی | تفریحی");

  return (
    <main className="min-h-screen bg-neutral-50 pb-20">
      <SpecialOffers />
      
      {/* سرچ باکس */}
      <section className="py-8">
        <div className="mx-auto max-w-6xl px-4">
          <SearchBar />
        </div>
      </section>

      {/* رویدادهای محبوب (اسلایدر بی‌نهایت) */}
      <PopularEvents />
       
            {/* سه دسته سه کارتی */}
      <section className="mt-12">
        <div className="mx-auto max-w-6xl px-4">
          
          {concerts.length > 0 && (
            <CategorySlider 
              title="کنسرت‌ها" 
              cityName={selectedCity}
              data={concerts} 
              categoryLink={`/events/${selectedCity}/کنسرت`} 
            />
          )}

          {theaters.length > 0 && (
            <CategorySlider 
              title="تئاتر و نمایش" 
              cityName={selectedCity}
              data={theaters} 
               categoryLink={`/events/${selectedCity}/تئاتر`}
            />
          )}

          {sports.length > 0 && (
            <CategorySlider 
              title=" ورزشی | تفریحی" 
              cityName={selectedCity}
              data={sports} 
              categoryLink={`/events/${selectedCity}/ورزش و تفریح`} 
            />
          )}
          
          {/* اگر هیچ رویدادی نبود، یک پیام کوتاه نمایش بده (اختیاری) */}
          {concerts.length === 0 && theaters.length === 0 && sports.length === 0 && (
            <div className="text-center py-20 text-neutral-500">
              رویدادی برای شهر {selectedCity} یافت نشد.
            </div>
          )}

        </div>
      </section>

       
      

    </main>
  );
}
