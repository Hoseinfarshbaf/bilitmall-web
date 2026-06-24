import { events } from "@/data/events";
import EventCard from "@/components/EventCard";

type Props = {
  params: {
    city: string;
  };
};

export default function CityEventsPage({ params }: Props) {
  const cityName = decodeURIComponent(params.city);
  const cityEvents = events.filter((event) => event.city === cityName);

  return (
    <main className="min-h-screen bg-neutral-50 py-10">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-neutral-900">
            همه رویدادهای {cityName}
          </h1>
          <p className="mt-2 text-sm font-medium text-neutral-500">
            لیست رویدادهای این شهر
          </p>
        </div>

        {cityEvents.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-neutral-300 bg-white p-10 text-center text-neutral-500">
            فعلاً رویدادی برای این شهر ثبت نشده است.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cityEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
