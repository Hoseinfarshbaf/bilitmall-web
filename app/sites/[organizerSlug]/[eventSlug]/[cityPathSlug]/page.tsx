import { notFound, redirect } from "next/navigation";
import { getPublicMyEventPage, resolveEventPublicUrl } from "@/lib/my-event/store";

type PageProps = {
  params: Promise<{ organizerSlug: string; eventSlug: string; cityPathSlug: string }>;
};

/** Old two-segment URLs → myevent.{brand}/{eventEn} */
export default async function LegacyCityPathRedirect({ params }: PageProps) {
  const { organizerSlug, eventSlug } = await params;
  const page = await getPublicMyEventPage(organizerSlug, eventSlug);

  if (!page?.event) return notFound();

  redirect(
    resolveEventPublicUrl(organizerSlug, {
      title: page.event.title,
      slug: page.event.slug,
      publicEventSlug: page.event.publicEventSlug,
    })
  );
}
