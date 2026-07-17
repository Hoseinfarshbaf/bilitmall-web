import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/events/date-utils";
import {
  countBookableSeats,
  createEmptyLayout,
  parseSeatingLayoutJson,
} from "@/lib/seating/layout";
import type { SeatingLayout } from "@/lib/seating/types";

export type VenueListFilters = {
  q?: string;
  city?: string;
  source?: "admin" | "organizer" | "";
};

export type VenueCatalogRow = {
  id: number;
  name: string;
  slug: string;
  city: string;
  address: string;
  isDefault: boolean;
  source: "admin" | "organizer";
  organizerId: number | null;
  organizerName: string | null;
  organizerSlug: string | null;
  seatCount: number;
  layout: SeatingLayout;
  createdAt: string;
  updatedAt: string;
};

function tokenizeQuery(q: string): string[] {
  return q
    .trim()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

function buildVenueTemplateWhere(filters?: VenueListFilters, adminOnly?: boolean) {
  const tokens = tokenizeQuery(filters?.q ?? "");
  const city = filters?.city?.trim();
  const source = filters?.source?.trim();

  return {
    ...(adminOnly
      ? { OR: [{ source: "admin" }, { source: { equals: "" } }] }
      : {}),
    ...(city && city !== "همه" ? { city } : {}),
    ...(!adminOnly && (source === "admin" || source === "organizer") ? { source } : {}),
    ...(tokens.length
      ? {
          AND: tokens.map((token) => ({
            OR: [
              { name: { contains: token, mode: "insensitive" as const } },
              { address: { contains: token, mode: "insensitive" as const } },
              { slug: { contains: token, mode: "insensitive" as const } },
            ],
          })),
        }
      : {}),
  };
}

function parseVenueLayout(record: { name: string; layout: string }): SeatingLayout {
  let parsed = parseSeatingLayoutJson(record.layout);
  if (!parsed || parsed.cells.length === 0) {
    const meta = parsed ?? {
      rows: 8,
      cols: 12,
      stagePosition: "top" as const,
      defaultPriceRial: 350_000,
    };
    parsed = createEmptyLayout(
      record.name,
      meta.rows,
      meta.cols,
      meta.stagePosition,
      meta.defaultPriceRial ?? 350_000
    );
  }
  return parsed;
}

function toCatalogRow(record: {
  id: number;
  name: string;
  slug: string;
  city: string;
  address: string;
  isDefault: boolean;
  source: string;
  myEventOrganizerId: number | null;
  myEventOrganizer?: { displayName: string; slug: string } | null;
  layout: string;
  createdAt: Date;
  updatedAt: Date;
}): VenueCatalogRow {
  const layout = parseVenueLayout(record);
  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    city: record.city,
    address: record.address,
    isDefault: record.isDefault,
    source: record.source === "organizer" ? "organizer" : "admin",
    organizerId: record.myEventOrganizerId,
    organizerName: record.myEventOrganizer?.displayName ?? null,
    organizerSlug: record.myEventOrganizer?.slug ?? null,
    seatCount: countBookableSeats(layout),
    layout,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function listAdminVenueTemplates(filters?: VenueListFilters) {
  const records = await prisma.venueTemplate.findMany({
    where: buildVenueTemplateWhere(filters, true),
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });
  return records.map((record) => toCatalogRow({ ...record, myEventOrganizer: null }));
}

export async function listCatalogVenues(filters?: VenueListFilters) {
  const records = await prisma.venueTemplate.findMany({
    where: buildVenueTemplateWhere(filters, false),
    include: {
      myEventOrganizer: { select: { displayName: true, slug: true } },
    },
    orderBy: [{ city: "asc" }, { name: "asc" }],
  });
  return records.map(toCatalogRow);
}

/** @deprecated use listAdminVenueTemplates or listCatalogVenues */
export async function listVenueTemplates() {
  return listCatalogVenues();
}

export async function getVenueTemplateById(id: number) {
  const record = await prisma.venueTemplate.findUnique({ where: { id } });
  if (!record) return null;
  const layout =
    parseSeatingLayoutJson(record.layout) ?? createEmptyLayout(record.name);
  return { ...record, layout };
}

export async function saveVenueTemplate(data: {
  id?: number;
  name: string;
  slug: string;
  city?: string;
  address?: string;
  isDefault?: boolean;
  layout: SeatingLayout;
  source?: "admin" | "organizer";
  myEventOrganizerId?: number | null;
  sourceSeatingPlanId?: number | null;
}) {
  const layoutJson = JSON.stringify(data.layout);
  const city = data.city?.trim() ?? "";
  const address = data.address?.trim() ?? "";
  const source = data.source ?? "admin";

  if (data.isDefault) {
    await prisma.venueTemplate.updateMany({ data: { isDefault: false } });
  }

  if (data.id) {
    return prisma.venueTemplate.update({
      where: { id: data.id },
      data: {
        name: data.name,
        slug: data.slug,
        city,
        address,
        isDefault: data.isDefault ?? false,
        layout: layoutJson,
      },
    });
  }

  return prisma.venueTemplate.create({
    data: {
      name: data.name,
      slug: data.slug,
      city,
      address,
      isDefault: data.isDefault ?? false,
      layout: layoutJson,
      source,
      myEventOrganizerId: data.myEventOrganizerId ?? null,
      sourceSeatingPlanId: data.sourceSeatingPlanId ?? null,
    },
  });
}

export async function deleteVenueTemplate(id: number) {
  const linkedEvents = await prisma.event.count({ where: { venueTemplateId: id } });
  if (linkedEvents > 0) {
    throw new Error("این سالن به رویدادهایی متصل است و قابل حذف نیست.");
  }
  await prisma.venueTemplate.delete({ where: { id } });
}

export async function getEventSeatingPlan(eventId: number) {
  const record = await prisma.eventSeatingPlan.findUnique({ where: { eventId } });
  if (!record) return null;
  const layout = parseSeatingLayoutJson(record.layout);
  if (!layout) return null;
  return { id: record.id, eventId: record.eventId, name: record.name, layout };
}

export async function saveEventSeatingPlan(
  eventId: number,
  layout: SeatingLayout,
  name?: string,
  options?: { approvalStatus?: "pending" | "approved" }
) {
  const layoutJson = JSON.stringify(layout);
  const existing = await prisma.eventSeatingPlan.findUnique({ where: { eventId } });

  const data = {
    name: name ?? layout.name,
    layout: layoutJson,
  };

  if (existing) {
    const approvalStatus =
      options?.approvalStatus ??
      (existing.approvalStatus === "approved" ? "approved" : "pending");
    return prisma.eventSeatingPlan.update({
      where: { eventId },
      data: { ...data, approvalStatus },
    });
  }

  return prisma.eventSeatingPlan.create({
    data: {
      eventId,
      ...data,
      approvalStatus: options?.approvalStatus ?? "pending",
    },
  });
}

export type OrganizerSeatingPlanRow = {
  id: number;
  eventId: number;
  eventTitle: string;
  eventPlace: string;
  eventCity: string;
  organizerId: number;
  organizerName: string;
  organizerSlug: string;
  name: string;
  seatCount: number;
  layout: SeatingLayout;
  approvalStatus: string;
  createdAt: string;
  updatedAt: string;
};

export type OrganizerPlanFilters = {
  q?: string;
  city?: string;
  organizer?: string;
};

export async function listOrganizerSeatingPlans(
  filters?: OrganizerPlanFilters
): Promise<OrganizerSeatingPlanRow[]> {
  const city = filters?.city?.trim();

  const records = await prisma.eventSeatingPlan.findMany({
    where: {
      approvalStatus: "pending",
      event: {
        myEventOrganizerId: { not: null },
        venueTemplateId: null,
        ...(city && city !== "همه" ? { city } : {}),
      },
    },
    include: {
      event: {
        include: {
          myEventOrganizer: {
            select: { id: true, displayName: true, slug: true },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  let rows = records
    .filter((record) => record.event.myEventOrganizer)
    .map((record) => {
      const organizerRecord = record.event.myEventOrganizer!;
      const layout =
        parseSeatingLayoutJson(record.layout) ??
        createEmptyLayout(record.name || record.event.title);
      return {
        id: record.id,
        eventId: record.eventId,
        eventTitle: record.event.title,
        eventPlace: record.event.place,
        eventCity: record.event.city,
        organizerId: organizerRecord.id,
        organizerName: organizerRecord.displayName,
        organizerSlug: organizerRecord.slug,
        name: record.name || layout.name,
        seatCount: countBookableSeats(layout),
        layout,
        approvalStatus: record.approvalStatus,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
      };
    });

  const q = filters?.q?.trim().toLowerCase();
  if (q) {
    rows = rows.filter(
      (row) =>
        row.eventTitle.toLowerCase().includes(q) ||
        row.eventPlace.toLowerCase().includes(q) ||
        row.name.toLowerCase().includes(q) ||
        row.eventCity.toLowerCase().includes(q)
    );
  }

  const organizer = filters?.organizer?.trim().toLowerCase();
  if (organizer) {
    rows = rows.filter(
      (row) =>
        row.organizerName.toLowerCase().includes(organizer) ||
        row.organizerSlug.toLowerCase().includes(organizer)
    );
  }

  return rows;
}

export async function deleteOrganizerSeatingPlan(id: number) {
  const record = await prisma.eventSeatingPlan.findUnique({
    where: { id },
    include: { event: { select: { venueTemplateId: true } } },
  });
  if (!record) return false;
  if (record.approvalStatus === "approved") {
    throw new Error("سالن تأییدشده از این بخش قابل حذف نیست — از فهرست کل سالن‌ها حذف کنید.");
  }
  if (record.event.venueTemplateId != null) {
    throw new Error("این نقشه از سالن تأییدشده کپی شده و قابل حذف نیست.");
  }
  await prisma.eventSeatingPlan.delete({ where: { id } });
  return true;
}

export async function getOrganizerSeatingPlanById(id: number) {
  const rows = await listOrganizerSeatingPlans();
  return rows.find((row) => row.id === id) ?? null;
}

export async function saveOrganizerSeatingPlanById(id: number, layout: SeatingLayout) {
  const record = await prisma.eventSeatingPlan.findUnique({
    where: { id },
    include: { event: { select: { venueTemplateId: true } } },
  });
  if (!record) return null;
  if (record.approvalStatus === "approved") {
    throw new Error("این سالن تأیید شده — از فهرست «کل سالن‌ها» ویرایش کنید.");
  }
  if (record.event.venueTemplateId != null) {
    throw new Error("این نقشه از سالن تأییدشده کپی شده و قابل ویرایش مستقیم نیست.");
  }
  return saveEventSeatingPlan(record.eventId, layout, layout.name, {
    approvalStatus: "pending",
  });
}

export async function searchVenueTemplates(query: string, city?: string) {
  const cityName = city?.trim();
  const tokens = query
    .trim()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  const records = await prisma.venueTemplate.findMany({
    where: {
      ...(cityName ? { city: cityName } : {}),
      ...(tokens.length > 0
        ? {
            AND: tokens.map((token) => ({
              OR: [
                { name: { contains: token, mode: "insensitive" as const } },
                { address: { contains: token, mode: "insensitive" as const } },
                { slug: { contains: token, mode: "insensitive" as const } },
              ],
            })),
          }
        : {}),
    },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    take: 15,
    select: { id: true, name: true, slug: true, city: true, address: true },
  });

  return records;
}

async function buildUniqueVenueSlug(name: string, city?: string): Promise<string> {
  const base = slugify(city ? `${name}-${city}` : name);
  let slugBase = base;
  if (!slugBase) slugBase = `venue-${Date.now()}`;
  let slug = slugBase;
  let counter = 1;
  while (await prisma.venueTemplate.findUnique({ where: { slug } })) {
    slug = `${slugBase}-${counter}`;
    counter += 1;
  }
  return slug;
}

export async function promoteOrganizerSeatingPlanToVenueTemplate(planId: number) {
  const record = await prisma.eventSeatingPlan.findUnique({
    where: { id: planId },
    include: { event: { include: { myEventOrganizer: true } } },
  });
  if (!record || !record.event.myEventOrganizerId) return null;
  if (record.approvalStatus === "approved" && record.promotedVenueTemplateId) {
    throw new Error("این سالن قبلاً تأیید شده است.");
  }
  if (record.event.venueTemplateId != null) {
    throw new Error("رویداد از سالن تأییدشده استفاده می‌کند — نیازی به تأیید مجدد نیست.");
  }

  const plan = record;
  const layout =
    parseSeatingLayoutJson(plan.layout) ??
    createEmptyLayout(plan.name || plan.event.place);
  const name = plan.event.place.trim() || plan.name.trim() || layout.name;
  const city = plan.event.city.trim();
  const address = plan.event.placeAddress?.trim() ?? "";
  const organizerId = plan.event.myEventOrganizerId;
  const catalogLayout = { ...layout, name };
  const eventId = plan.eventId;

  async function finalize(templateId: number, templateName: string, updated: boolean) {
    await prisma.$transaction([
      prisma.eventSeatingPlan.update({
        where: { id: planId },
        data: {
          approvalStatus: "approved",
          promotedVenueTemplateId: templateId,
          name: templateName,
        },
      }),
      prisma.event.update({
        where: { id: eventId },
        data: {
          venueTemplateId: templateId,
          place: templateName,
          ...(address ? { placeAddress: address } : {}),
        },
      }),
    ]);

    const template = await prisma.venueTemplate.findUniqueOrThrow({
      where: { id: templateId },
      select: { id: true, name: true, slug: true, city: true, address: true },
    });

    return {
      id: template.id,
      name: template.name,
      slug: template.slug,
      city: template.city,
      address: template.address,
      updated,
    };
  }

  const existingByPlan = await prisma.venueTemplate.findFirst({
    where: { sourceSeatingPlanId: planId },
  });

  if (existingByPlan) {
    const updated = await saveVenueTemplate({
      id: existingByPlan.id,
      name: existingByPlan.name,
      slug: existingByPlan.slug,
      city: existingByPlan.city,
      address: address || existingByPlan.address,
      isDefault: existingByPlan.isDefault,
      layout: { ...catalogLayout, name: existingByPlan.name },
    });
    return finalize(updated.id, updated.name, true);
  }

  // فقط سالن‌های قبلی خود برگزارکننده با همان نام/شهر را به‌روز کن — سالن‌های مدیر را بازنویسی نکن
  const existingOrganizerVenue = await prisma.venueTemplate.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      city,
      source: "organizer",
      myEventOrganizerId: organizerId,
    },
  });

  if (existingOrganizerVenue) {
    const updated = await saveVenueTemplate({
      id: existingOrganizerVenue.id,
      name: existingOrganizerVenue.name,
      slug: existingOrganizerVenue.slug,
      city: existingOrganizerVenue.city,
      address: address || existingOrganizerVenue.address,
      isDefault: existingOrganizerVenue.isDefault,
      layout: { ...catalogLayout, name: existingOrganizerVenue.name },
    });
    await prisma.venueTemplate.update({
      where: { id: updated.id },
      data: {
        source: "organizer",
        myEventOrganizerId: organizerId,
        sourceSeatingPlanId: planId,
      },
    });
    return finalize(updated.id, updated.name, true);
  }

  const slug = await buildUniqueVenueSlug(name, city);
  const created = await saveVenueTemplate({
    name,
    slug,
    city,
    address,
    layout: catalogLayout,
    source: "organizer",
    myEventOrganizerId: organizerId,
    sourceSeatingPlanId: planId,
  });
  return finalize(created.id, created.name, false);
}

export async function resolveInitialEventSeatingLayout(
  eventId: number,
  event: { place: string; title: string; venueTemplateId: number | null }
): Promise<SeatingLayout> {
  const existing = await getEventSeatingPlan(eventId);
  if (existing) return existing.layout;

  if (event.venueTemplateId) {
    const template = await getVenueTemplateById(event.venueTemplateId);
    if (template?.layout) {
      return { ...template.layout, name: template.name };
    }
  }

  return createEmptyLayout(event.place.trim() || event.title);
}

export async function syncEventSeatingFromVenueTemplate(
  eventId: number,
  venueTemplateId: number
) {
  const template = await getVenueTemplateById(venueTemplateId);
  if (!template?.layout) return null;
  return saveEventSeatingPlan(
    eventId,
    { ...template.layout, name: template.name },
    template.name,
    { approvalStatus: "approved" }
  );
}

export async function getDefaultVenueLayout(): Promise<SeatingLayout> {
  const template = await prisma.venueTemplate.findFirst({
    where: { isDefault: true },
    orderBy: { id: "asc" },
  });

  if (template) {
    const parsed = parseSeatingLayoutJson(template.layout);
    if (parsed && parsed.cells.length > 0) return parsed;
    if (parsed) return createEmptyLayout(template.name, parsed.rows, parsed.cols);
  }

  return createEmptyLayout("سالن پیش‌فرض", 8, 12);
}
