import { headers } from "next/headers";
import { notFound } from "next/navigation";
import MyEventPublicPage from "@/components/my-event";
import { isMyEventPublicHost } from "@/lib/my-event/domains";
import { buildPublicEventSlug } from "@/lib/my-event/public-slugs";
import { getPublicMyEventPage } from "@/lib/my-event/store";
import { managedToEventItem } from "@/lib/events/date-utils";
import { parseDaysFromRecord } from "@/lib/events/date-utils";

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

  const eventItem = page.event
    ? managedToEventItem({
        id: page.event.id,
        slug: page.event.slug,
        title: page.event.title,
        city: page.event.city,
        category: page.event.category,
        place: page.event.place,
        price: page.event.price,
        image: page.event.image,
        bannerImage: "",
        badge: page.event.badge ?? undefined,
        days: parseDaysFromRecord(page.event.days),
        published: page.event.published,
        popular: page.event.popular,
        featured: page.event.featured,
        ticketingType: page.event.ticketingType as "INTERNAL" | "EXTERNAL_LINK",
        hasAssignedSeating: page.event.hasAssignedSeating,
        status: page.event.status as "active",
        createdAt: page.event.createdAt.toISOString(),
        updatedAt: page.event.updatedAt.toISOString(),
      })
    : null;

  return (
    <MyEventPublicPage
      organizer={{
        slug: page.organizer.slug,
        displayName: page.organizer.displayName,
        bio: page.organizer.bio,
        coverImage: page.organizer.coverImage,
        logoImage: page.organizer.logoImage,
      }}
      event={eventItem}
      description={page.event?.description}
      allEvents={page.events.map((e) => ({
        publicEventSlug: e.publicEventSlug ?? buildPublicEventSlug(e.title),
        title: e.title,
      }))}
      onSubdomain={await isOnSubdomain()}
    />
  );
}
