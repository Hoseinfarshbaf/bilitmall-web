import { events } from "@/data/events";
import EventCard from "@/components/EventCard";
import { notFound } from "next/navigation";

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const decoded = decodeURIComponent(category);
  const filtered = events.filter((e) => e.category === decoded);

  if (filtered.length === 0) return notFound();

  return (
    <main className="min-h-screen bg-neutral-50 p-6" dir="rtl">
      <h1 className="text-2xl font-black text-neutral-900 mb-8">{decoded}</h1>
      <div className="flex flex-wrap gap-4">
        {filtered.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </main>
  );
}