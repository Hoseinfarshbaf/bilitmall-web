import { prisma } from "@/lib/prisma";
import type { MyEventSession } from "./auth";
import { MY_EVENT_EVENT_SOURCE, isMyEventEventApproved } from "./constants";
import {
  buildPublicCitySlug,
  buildPublicEventSlug,
  isValidPublicEventSlug,
  normalizePublicEventSlug,
  resolvePublicSlugsForEvent,
} from "./public-slugs";
import { getMyEventPublicUrl } from "./domains";
export { isMyEventEventApproved } from "./constants";

export type MyEventOrganizerProfile = {
  id: number;
  slug: string;
  displayName: string;
  bio: string | null;
  coverImage: string;
  logoImage: string;
  avatarImage: string;
  phone: string | null;
  email: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type MyEventDashboardEvent = {
  id: number;
  slug: string;
  title: string;
  city: string;
  category: string;
  place: string;
  price: string;
  image: string;
  description: string | null;
  hasAssignedSeating: boolean;
  listOnBilitmallRequested: boolean;
  listOnBilitmallApproved: boolean;
  publicEventSlug: string | null;
  publicCitySlug: string | null;
  published: boolean;
  status: string;
  hasSeatingPlan: boolean;
  venueTemplateId: number | null;
  createdAt: string;
};

export async function getMyEventUserByPhone(phone: string) {
  return prisma.myEventUser.findUnique({
    where: { phone },
    include: { myEventOrganizer: true },
  });
}

export async function getMyEventOrganizerBySlug(slug: string) {
  return prisma.myEventOrganizer.findUnique({ where: { slug } });
}

export async function isMyEventSlugTaken(
  slug: string,
  excludeOrganizerId?: number
): Promise<boolean> {
  const existing = await prisma.myEventOrganizer.findUnique({ where: { slug } });
  if (!existing) return false;
  if (excludeOrganizerId != null && existing.id === excludeOrganizerId) return false;
  return true;
}

export function splitPersonName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  if (!trimmed) return { firstName: "", lastName: "" };
  const space = trimmed.indexOf(" ");
  if (space === -1) return { firstName: trimmed, lastName: "" };
  return {
    firstName: trimmed.slice(0, space),
    lastName: trimmed.slice(space + 1).trim(),
  };
}

export function joinPersonName(firstName: string, lastName: string): string {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
}

export async function getSessionMyEventOrganizer(session: MyEventSession) {
  const user = await prisma.myEventUser.findUnique({
    where: { id: session.userId },
    include: { myEventOrganizer: true },
  });

  if (!user || user.myEventOrganizerId !== session.organizerId) return null;
  return user;
}

export async function getMyEventOrganizerProfile(
  organizerId: number
): Promise<MyEventOrganizerProfile | null> {
  const record = await prisma.myEventOrganizer.findUnique({
    where: { id: organizerId },
  });
  if (!record) return null;

  return {
    id: record.id,
    slug: record.slug,
    displayName: record.displayName,
    bio: record.bio,
    coverImage: record.coverImage,
    logoImage: record.logoImage,
    avatarImage: record.avatarImage,
    phone: record.phone,
    email: record.email,
    status: record.status,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export type MyEventProfileUpdateInput = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  displayName?: string;
  slug?: string;
  bio?: string;
  email?: string;
  coverImage?: string;
  logoImage?: string;
  avatarImage?: string;
  currentPassword?: string;
  newPassword?: string;
};

export type MyEventProfileUpdateResult =
  | { ok: true; profile: MyEventOrganizerProfile; userName: string; userPhone: string }
  | { ok: false; error: string; status: number };

export async function updateMyEventOrganizerProfile(
  userId: number,
  organizerId: number,
  input: MyEventProfileUpdateInput
): Promise<MyEventProfileUpdateResult> {
  const { hashPassword, verifyPassword, normalizeMyEventSlug, isValidMyEventSlug } =
    await import("./auth");
  const { normalizePhone, isValidIranMobile } = await import("@/lib/auth/phone");

  const user = await prisma.myEventUser.findUnique({
    where: { id: userId },
    include: { myEventOrganizer: true },
  });

  if (!user || user.myEventOrganizerId !== organizerId) {
    return { ok: false, error: "Unauthorized", status: 401 };
  }

  const organizer = user.myEventOrganizer;
  const nextFirstName = input.firstName?.trim() ?? splitPersonName(user.name).firstName;
  const nextLastName = input.lastName?.trim() ?? splitPersonName(user.name).lastName;
  const nextName = joinPersonName(nextFirstName, nextLastName);

  if (!nextName) {
    return { ok: false, error: "نام و نام خانوادگی الزامی است.", status: 400 };
  }

  let nextPhone = user.phone;
  if (input.phone !== undefined) {
    nextPhone = normalizePhone(input.phone);
    if (!isValidIranMobile(nextPhone)) {
      return { ok: false, error: "شماره موبایل معتبر نیست.", status: 400 };
    }
    if (nextPhone !== user.phone) {
      const phoneTaken = await prisma.myEventUser.findUnique({ where: { phone: nextPhone } });
      if (phoneTaken && phoneTaken.id !== userId) {
        return { ok: false, error: "این شماره موبایل قبلاً ثبت شده است.", status: 409 };
      }
    }
  }

  const nextDisplayName = input.displayName?.trim() || organizer.displayName;
  if (!nextDisplayName) {
    return { ok: false, error: "نام برند الزامی است.", status: 400 };
  }

  let nextSlug = organizer.slug;
  if (input.slug !== undefined) {
    nextSlug = normalizeMyEventSlug(input.slug);
    if (!isValidMyEventSlug(nextSlug)) {
      return {
        ok: false,
        error: "آدرس صفحه فقط حروف انگلیسی کوچک، عدد و خط تیره باشد.",
        status: 400,
      };
    }
    if (nextSlug !== organizer.slug && (await isMyEventSlugTaken(nextSlug, organizerId))) {
      return { ok: false, error: "این آدرس صفحه قبلاً ثبت شده است.", status: 409 };
    }
  }

  let passwordHash = user.passwordHash;
  if (input.newPassword) {
    if (input.newPassword.length < 8) {
      return { ok: false, error: "رمز عبور جدید باید حداقل ۸ کاراکتر باشد.", status: 400 };
    }
    if (!input.currentPassword || !verifyPassword(input.currentPassword, user.passwordHash)) {
      return { ok: false, error: "رمز عبور فعلی اشتباه است.", status: 400 };
    }
    passwordHash = hashPassword(input.newPassword);
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.myEventUser.update({
      where: { id: userId },
      data: {
        name: nextName,
        phone: nextPhone,
        ...(input.newPassword ? { passwordHash } : {}),
      },
    });

    return tx.myEventOrganizer.update({
      where: { id: organizerId },
      data: {
        displayName: nextDisplayName,
        slug: nextSlug,
        phone: nextPhone,
        bio: input.bio !== undefined ? input.bio.trim() || null : organizer.bio,
        email: input.email !== undefined ? input.email.trim() || null : organizer.email,
        coverImage: input.coverImage ?? organizer.coverImage,
        logoImage: input.logoImage ?? organizer.logoImage,
        avatarImage: input.avatarImage ?? organizer.avatarImage,
      },
    });
  });

  const profile = await getMyEventOrganizerProfile(organizerId);
  if (!profile) {
    return { ok: false, error: "خطا در ذخیره پروفایل.", status: 500 };
  }

  return {
    ok: true,
    profile,
    userName: nextName,
    userPhone: nextPhone,
  };
}

export async function getMyEventOrganizerEvents(
  organizerId: number
): Promise<MyEventDashboardEvent[]> {
  const records = await prisma.event.findMany({
    where: { myEventOrganizerId: organizerId },
    orderBy: { createdAt: "desc" },
    include: { seatingPlan: { select: { id: true } } },
  });

  return records.map((record) => ({
    id: record.id,
    slug: record.slug,
    title: record.title,
    city: record.city,
    category: record.category,
    place: record.place,
    price: record.price,
    image: record.image,
    description: record.description,
    hasAssignedSeating: record.hasAssignedSeating,
    listOnBilitmallRequested: record.listOnBilitmallRequested,
    listOnBilitmallApproved: record.listOnBilitmallApproved,
    publicEventSlug: record.publicEventSlug,
    publicCitySlug: record.publicCitySlug,
    published: record.published,
    status: record.status,
    hasSeatingPlan: Boolean(record.seatingPlan) || record.venueTemplateId != null,
    venueTemplateId: record.venueTemplateId,
    createdAt: record.createdAt.toISOString(),
  }));
}

export async function getMyEventOrganizerEvent(
  organizerId: number,
  eventId: number
) {
  return prisma.event.findFirst({
    where: { id: eventId, myEventOrganizerId: organizerId, source: MY_EVENT_EVENT_SOURCE },
  });
}

export async function assignUniquePublicSlugs(
  organizerId: number,
  title: string,
  city: string,
  options?: { excludeEventId?: number; requestedSlug?: string }
): Promise<{ publicEventSlug: string; publicCitySlug: string }> {
  const base = resolvePublicSlugsForEvent(title, city);
  const requested = options?.requestedSlug?.trim()
    ? normalizePublicEventSlug(options.requestedSlug)
    : "";

  let publicEventSlug = requested || base.publicEventSlug;
  const publicCitySlug = base.publicCitySlug;

  if (!isValidPublicEventSlug(publicEventSlug)) {
    throw new Error(
      "نام انگلیسی لینک رویداد الزامی است — فقط حروف کوچک انگلیسی، عدد و خط تیره."
    );
  }

  let counter = 1;
  const stem = publicEventSlug;

  while (true) {
    const existing = await prisma.event.findFirst({
      where: {
        myEventOrganizerId: organizerId,
        publicEventSlug,
        ...(options?.excludeEventId ? { id: { not: options.excludeEventId } } : {}),
      },
    });
    if (!existing) break;
    publicEventSlug = `${stem}${counter}`;
    counter += 1;
  }

  return { publicEventSlug, publicCitySlug };
}

export function resolveEventPublicUrl(
  organizerSlug: string,
  event: {
    title: string;
    slug: string;
    publicEventSlug: string | null;
  }
): string {
  const publicEventSlug =
    event.publicEventSlug ?? buildPublicEventSlug(event.title);
  return getMyEventPublicUrl(organizerSlug, publicEventSlug);
}

export async function deleteMyEventOrganizerEvent(
  organizerId: number,
  eventId: number
): Promise<boolean> {
  const event = await getMyEventOrganizerEvent(organizerId, eventId);
  if (!event) return false;
  await prisma.event.delete({ where: { id: eventId } });
  return true;
}

export async function updateMyEventOrganizerForAdmin(
  id: number,
  data: {
    displayName?: string;
    slug?: string;
    phone?: string | null;
    email?: string | null;
    bio?: string | null;
    status?: string;
  }
) {
  return prisma.myEventOrganizer.update({ where: { id }, data });
}

export async function deleteMyEventOrganizerForAdmin(id: number) {
  return prisma.myEventOrganizer.delete({ where: { id } });
}

export async function listMyEventOrganizersForAdmin() {
  const records = await prisma.myEventOrganizer.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { events: true, users: true } },
    },
  });

  return records.map((record) => ({
    id: record.id,
    slug: record.slug,
    displayName: record.displayName,
    status: record.status,
    phone: record.phone,
    email: record.email,
    eventCount: record._count.events,
    userCount: record._count.users,
    createdAt: record.createdAt.toISOString(),
  }));
}

export async function updateMyEventOrganizerStatus(id: number, status: string) {
  return prisma.myEventOrganizer.update({
    where: { id },
    data: { status },
  });
}

export async function listMyEventEventsForAdmin() {
  const records = await prisma.event.findMany({
    where: { source: MY_EVENT_EVENT_SOURCE },
    orderBy: { createdAt: "desc" },
    include: {
      myEventOrganizer: {
        select: {
          id: true,
          slug: true,
          displayName: true,
          status: true,
          phone: true,
        },
      },
    },
  });

  return records.map((record) => ({
    id: record.id,
    slug: record.slug,
    title: record.title,
    city: record.city,
    publicEventSlug: record.publicEventSlug,
    publicCitySlug: record.publicCitySlug,
    place: record.place,
    price: record.price,
    published: record.published,
    status: record.status,
    listOnBilitmallRequested: record.listOnBilitmallRequested,
    listOnBilitmallApproved: record.listOnBilitmallApproved,
    createdAt: record.createdAt.toISOString(),
    organizer: record.myEventOrganizer
      ? {
          id: record.myEventOrganizer.id,
          slug: record.myEventOrganizer.slug,
          displayName: record.myEventOrganizer.displayName,
          status: record.myEventOrganizer.status,
          phone: record.myEventOrganizer.phone,
        }
      : null,
  }));
}

export async function updateMyEventEventApproval(
  id: number,
  options:
    | { action: "reject" }
    | {
        action: "approve";
        approveMyEventPage?: boolean;
        approveBilitmall?: boolean;
      }
) {
  const event = await prisma.event.findUnique({
    where: { id },
    include: { myEventOrganizer: true },
  });

  if (!event || event.source !== MY_EVENT_EVENT_SOURCE) {
    return null;
  }

  if (options.action === "reject") {
    return prisma.event.update({
      where: { id },
      data: {
        published: false,
        status: "rejected",
        listOnBilitmallApproved: false,
      },
    });
  }

  if (event.myEventOrganizer?.status !== "active") {
    throw new Error("ابتدا حساب برگزارکننده باید تأیید شود.");
  }

  const approvePage = options.approveMyEventPage ?? false;
  const approveBilitmall = options.approveBilitmall ?? false;

  if (!approvePage && !approveBilitmall) {
    throw new Error("حداقل یک کانال انتشار باید انتخاب شود.");
  }

  if (approveBilitmall && !event.listOnBilitmallRequested) {
    throw new Error("این رویداد درخواست انتشار در بلیت‌مال ندارد.");
  }

  if (approveBilitmall && !approvePage && event.status !== "active") {
    throw new Error("ابتدا صفحه اختصاصی باید تأیید شود.");
  }

  const data: {
    published?: boolean;
    status?: string;
    listOnBilitmallApproved?: boolean;
  } = {};

  if (approvePage) {
    data.published = true;
    data.status = "active";
  }

  if (approveBilitmall) {
    data.listOnBilitmallApproved = true;
  }

  return prisma.event.update({ where: { id }, data });
}

export async function deleteMyEventEventForAdmin(id: number): Promise<boolean> {
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event || event.source !== MY_EVENT_EVENT_SOURCE) return false;
  await prisma.event.delete({ where: { id } });
  return true;
}

export async function removeMyEventFromBilitmallForAdmin(id: number) {
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event || event.source !== MY_EVENT_EVENT_SOURCE) return null;
  if (!event.listOnBilitmallApproved) return event;

  return prisma.event.update({
    where: { id },
    data: { listOnBilitmallApproved: false },
  });
}

export async function listBilitmallListingRequestsForAdmin() {
  const records = await prisma.event.findMany({
    where: {
      source: MY_EVENT_EVENT_SOURCE,
      listOnBilitmallRequested: true,
    },
    orderBy: { createdAt: "desc" },
    include: {
      myEventOrganizer: {
        select: { id: true, slug: true, displayName: true, status: true, phone: true },
      },
    },
  });

  return records.map((record) => ({
    id: record.id,
    slug: record.slug,
    title: record.title,
    city: record.city,
    category: record.category,
    status: record.status,
    published: record.published,
    listOnBilitmallApproved: record.listOnBilitmallApproved,
    createdAt: record.createdAt.toISOString(),
    organizer: record.myEventOrganizer,
  }));
}

export async function updateBilitmallListingApproval(
  id: number,
  action: "approve" | "reject"
) {
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event || event.source !== MY_EVENT_EVENT_SOURCE || !event.listOnBilitmallRequested) {
    return null;
  }

  if (action === "approve") {
    if (event.status !== "active" || !event.published) {
      throw new Error("ابتدا رویداد باید در My Event تأیید شده باشد.");
    }
    return prisma.event.update({
      where: { id },
      data: { listOnBilitmallApproved: true },
    });
  }

  return prisma.event.update({
    where: { id },
    data: { listOnBilitmallApproved: false, listOnBilitmallRequested: false },
  });
}

export async function getPublicMyEventPage(
  organizerSlug: string,
  eventPathSlug?: string
) {
  const organizer = await prisma.myEventOrganizer.findUnique({
    where: { slug: organizerSlug },
    include: {
      events: {
        where: { published: true, status: "active" },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!organizer || organizer.status !== "active") {
    return null;
  }

  let event: (typeof organizer.events)[number] | undefined;

  if (eventPathSlug) {
    const normalized = eventPathSlug.toLowerCase();
    event = organizer.events.find(
      (item) =>
        item.publicEventSlug === normalized ||
        (item.publicEventSlug ?? buildPublicEventSlug(item.title)) === normalized ||
        item.slug === eventPathSlug
    );
  } else {
    event = organizer.events[0];
  }

  return { organizer, event, events: organizer.events };
}

export async function countMyEventFeaturedByCity(
  city: string,
  excludeOrganizerId?: number
): Promise<number> {
  return prisma.event.count({
    where: {
      featured: true,
      city,
      myEventOrganizerId: excludeOrganizerId ? { not: excludeOrganizerId } : undefined,
    },
  });
}
