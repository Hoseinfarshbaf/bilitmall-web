import PopularEvents from "@/components/PopularEvents";
import SearchBar from "@/components/SearchBar";
import SpecialOffers from "@/components/SpecialOffers";

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-50">
      <SpecialOffers />
      
      {/* سرچ باکس بدون باکس اضافه و بدون متن بلیت‌مال */}
      <section className="py-8">
        <div className="mx-auto max-w-6xl px-4">
          <SearchBar />
        </div>
      </section>

      <PopularEvents />
    </main>
  );
}
