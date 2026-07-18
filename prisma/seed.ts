import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/auth/password";
import { ensureCitiesSeeded } from "../lib/cities/store";
import { seedEvents } from "../lib/events/seed-events";
import { resolveTicketingType } from "../lib/events/types";
import { ensureSystemRoles, getRoleIdBySlug } from "../lib/admin/directory";
import { SYSTEM_ROLE_SLUGS } from "../lib/bilitmall/roles";

const prisma = new PrismaClient();

async function main() {
  await ensureCitiesSeeded();
  await ensureSystemRoles();
  const userRoleId = await getRoleIdBySlug(SYSTEM_ROLE_SLUGS.user);

  for (const seed of seedEvents) {    const days =
      seed.days ??
      (seed.date && seed.time
        ? [{ date: seed.date, sessions: [{ time: seed.time }] }]
        : []);

    const data = {
      slug: seed.slug,
      title: seed.title,
      city: seed.city,
      category: seed.category,
      place: seed.place,
      price: seed.price,
      image: seed.image,
      badge: seed.badge ?? null,
      days: JSON.stringify(days),
      published: true,
      popular: seed.popular ?? false,
      featured: seed.featured ?? false,
      ticketingType: seed.ticketingType ?? resolveTicketingType(seed.category),
      status: "active",
      source: "seed",
    };

    await prisma.event.upsert({
      where: { slug: seed.slug },
      create: data,
      update: data,
    });
  }

  console.log(`Seeded ${seedEvents.length} events.`);

  const demoPhone = "09120000000";
  const demoUser = await prisma.bilitmallUser.upsert({
    where: { phone: demoPhone },
    create: {
      phone: demoPhone,
      name: "کاربر نمونه",
      email: "demo@bilitmall.com",
      passwordHash: hashPassword("demo12345"),
      roleId: userRoleId,
    },
    update: {},
  });

  const sampleEvent = await prisma.event.findFirst({
    where: { slug: "concert-arman-tehran" },
  });

  if (sampleEvent) {
    const existingOrder = await prisma.ticketOrder.findFirst({
      where: { userId: demoUser.id, eventId: sampleEvent.id },
    });

    if (!existingOrder) {
      await prisma.ticketOrder.create({
        data: {
          userId: demoUser.id,
          eventId: sampleEvent.id,
          eventTitle: sampleEvent.title,
          eventSlug: sampleEvent.slug,
          amount: sampleEvent.price,
          amountRial: 350000,
          quantity: 2,
          sessionDate: "1405/05/12",
          sessionTime: "20:00",
          status: "paid",
          paymentRef: "BM-DEMO-1001",
          paymentMethod: "online",
        },
      });
    }
  }

  console.log("Demo bilitmall user: 09120000000 / demo12345");
}
main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
