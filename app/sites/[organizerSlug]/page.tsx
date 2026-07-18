import { headers } from "next/headers";
import { notFound } from "next/navigation";
import MyEventPublicPage from "@/components/my-event";
import { isMyEventPublicHost } from "@/lib/my-event/domains";
import { buildPublicEventSlug } from "@/lib/my-event/public-slugs";
import { getPublicMyEventPage } from "@/lib/my-event/store";
import {
  formatEventDateDisplay,
  managedToEventItem,
  parseDaysFromRecord,
} from "@/lib/events/date-utils";

type PageProps = {
  params: Promise<{ organizerSlug: string }>;
};

async function isOnSubdomain(): Promise<boolean> {
  const host = (await headers()).get("host") ?? "";
  return isMyEventPublicHost(host);
}

export default async function OrganizerSiteHomePage({ params }: PageProps) {
  const { organizerSlug } = await params;
  const page = await getPublicMyEventPage(organizerSlug);

  if (!page) return notFound();

  const allEvents = page.events.map((e) => {
    const item = managedToEventItem({
      id: e.id,
      slug: e.slug,
      title: e.title,
      city: e.city,
      category: e.category,
      place: e.place,
      placeAddress: e.placeAddress ?? undefined,
      price: e.price,
      image: e.image,
      bannerImage: "",
      badge: e.badge ?? undefined,
      days: parseDaysFromRecord(e.days),
      published: e.published,
      popular: e.popular,
      featured: e.featured,
      ticketingType: e.ticketingType as "INTERNAL" | "EXTERNAL_LINK",
      hasAssignedSeating: e.hasAssignedSeating,
      status: e.status as "active",
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    });

    return {
      publicEventSlug: e.publicEventSlug ?? buildPublicEventSlug(e.title),
      title: e.title,
      image: e.image,
      city: e.city,
      place: e.place,
      dateDisplay: formatEventDateDisplay(item),
    };
  });

  return (
    <MyEventPublicPage
      organizer={{
        slug: page.organizer.slug,
        displayName: page.organizer.displayName,
        bio: page.organizer.bio,
        coverImage: page.organizer.coverImage,
        logoImage: page.organizer.logoImage,
      }}
      event={null}
      allEvents={allEvents}
      onSubdomain={await isOnSubdomain()}
    />
  );
}
