import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  const events = await prisma.event.count();
  const organizers = await prisma.myEventOrganizer.count();
  console.log("OK", { events, organizers });
} catch (error) {
  console.error("DB_ERROR", error.message);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
