import { prisma } from "@/lib/prisma";
import { buildPublicCitySlug } from "@/lib/my-event/public-slugs";
import { DEFAULT_CITIES } from "@/lib/cities/constants";
import type { CityRecord, CityWithUsage } from "@/lib/cities/types";

function toCityRecord(row: {
  id: number;
  name: string;
  slug: string;
  sortOrder: number;
  isPopular: boolean;
  createdAt: Date;
  updatedAt: Date;
}): CityRecord {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sortOrder: row.sortOrder,
    isPopular: row.isPopular,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function ensureCitiesSeeded(): Promise<void> {
  const count = await prisma.city.count();
  if (count > 0) return;

  await prisma.city.createMany({
    data: DEFAULT_CITIES.map((city) => ({
      name: city.name,
      slug: city.slug,
      sortOrder: city.sortOrder,
      isPopular: city.isPopular,
    })),
    skipDuplicates: true,
  });
}

export async function listCities(): Promise<CityRecord[]> {
  await ensureCitiesSeeded();
  const rows = await prisma.city.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return rows.map(toCityRecord);
}

export async function getCityNames(): Promise<string[]> {
  const cities = await listCities();
  return cities.map((c) => c.name);
}

export async function listCitiesWithEventCount(): Promise<CityRecord[]> {
  await ensureCitiesSeeded();
  const rows = await prisma.city.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  const grouped = await prisma.event.groupBy({
    by: ["city"],
    where: { published: true },
    _count: { _all: true },
  });
  const countByCity = new Map(grouped.map((g) => [g.city, g._count._all]));

  return rows.map((row) => ({
    ...toCityRecord(row),
    eventCount: countByCity.get(row.name) ?? 0,
  }));
}

export async function listCitiesWithUsage(): Promise<CityWithUsage[]> {
  await ensureCitiesSeeded();
  const rows = await prisma.city.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  const usage = await Promise.all(
    rows.map(async (row) => {
      const [eventCount, venueCount] = await Promise.all([
        prisma.event.count({ where: { city: row.name } }),
        prisma.venueTemplate.count({ where: { city: row.name } }),
      ]);
      return {
        ...toCityRecord(row),
        eventCount,
        venueCount,
      };
    })
  );

  return usage;
}

async function resolveUniqueSlug(name: string): Promise<string> {
  const base = buildPublicCitySlug(name);
  let slug = base;
  let counter = 1;
  while (await prisma.city.findUnique({ where: { slug } })) {
    slug = `${base}-${counter}`;
    counter += 1;
  }
  return slug;
}

export async function createCity(
  name: string,
  options?: { isPopular?: boolean }
): Promise<CityRecord> {
  await ensureCitiesSeeded();
  const trimmed = name.trim().replace(/\s+/g, " ");
  if (!trimmed) {
    throw new Error("نام شهر الزامی است.");
  }
  if (trimmed.length < 2) {
    throw new Error("نام شهر باید حداقل ۲ کاراکتر باشد.");
  }

  const existing = await prisma.city.findUnique({ where: { name: trimmed } });
  if (existing) {
    throw new Error("این شهر قبلاً ثبت شده است.");
  }

  const maxOrder = await prisma.city.aggregate({ _max: { sortOrder: true } });
  const slug = await resolveUniqueSlug(trimmed);

  const row = await prisma.city.create({
    data: {
      name: trimmed,
      slug,
      isPopular: options?.isPopular ?? false,
      sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
    },
  });

  return toCityRecord(row);
}

export async function updateCity(
  id: number,
  data: { isPopular?: boolean }
): Promise<CityRecord> {
  const city = await prisma.city.findUnique({ where: { id } });
  if (!city) {
    throw new Error("شهر یافت نشد.");
  }

  const row = await prisma.city.update({
    where: { id },
    data: {
      ...(data.isPopular !== undefined ? { isPopular: data.isPopular } : {}),
    },
  });

  return toCityRecord(row);
}

export async function deleteCity(id: number): Promise<void> {
  const city = await prisma.city.findUnique({ where: { id } });
  if (!city) {
    throw new Error("شهر یافت نشد.");
  }

  const totalCities = await prisma.city.count();
  if (totalCities <= 1) {
    throw new Error("حداقل یک شهر باید در سیستم باقی بماند.");
  }

  const [eventCount, venueCount] = await Promise.all([
    prisma.event.count({ where: { city: city.name } }),
    prisma.venueTemplate.count({ where: { city: city.name } }),
  ]);

  if (eventCount > 0 || venueCount > 0) {
    throw new Error(
      `شهر «${city.name}» در ${eventCount.toLocaleString("fa-IR")} رویداد و ${venueCount.toLocaleString("fa-IR")} سالن استفاده شده و قابل حذف نیست.`
    );
  }

  await prisma.city.delete({ where: { id } });
}

export async function cityExists(name: string): Promise<boolean> {
  await ensureCitiesSeeded();
  const found = await prisma.city.findUnique({ where: { name: name.trim() } });
  return Boolean(found);
}

export async function getCitySlug(name: string): Promise<string | null> {
  await ensureCitiesSeeded();
  const city = await prisma.city.findUnique({ where: { name: name.trim() } });
  return city?.slug ?? null;
}
