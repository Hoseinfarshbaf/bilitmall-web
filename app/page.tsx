"use client";
import PopularEvents from "@/components/PopularEvents";
import SearchBar from "@/components/SearchBar";
import SpecialOffers from "@/components/SpecialOffers";
import CategorySlider from "@/components/CategorySlider";
import { events } from "@/data/events";
import { useCity } from "@/components/CityContext";

export default function Home() {
  const { selectedCity } = useCity();

  const cityEvents = events.filter((event) => event.city === selectedCity);
  const displayEvents = cityEvents.length > 0 
    ? cityEvents 
    : events.filter(e => e.city === "تهران");

  const concerts = displayEvents.filter((e) => e.category === "کنسرت");
  const theaters = displayEvents.filter((e) => e.category === "تئاتر");
  const sports = displayEvents.filter((e) => e.category === "ورزشی");

  return (
    <main className="min-h-screen bg-neutral-50 pb-20">
      <SpecialOffers />
      
      <section className="py-8">
        <div className="mx-auto max-w-6xl px-4">
          <SearchBar />
        </div>
      </section>

      <PopularEvents />
       
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
              title="ورزشی" 
              cityName={selectedCity}
              data={sports} 
              categoryLink={`/events/${selectedCity}/ورزشی`} 
            />
          )}
          
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