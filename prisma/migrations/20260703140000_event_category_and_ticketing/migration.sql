-- Remove legacy sports sample events
DELETE FROM "Event" WHERE category = 'ورزشی';

-- AlterTable
ALTER TABLE "Event" ADD COLUMN "ticketingType" TEXT NOT NULL DEFAULT 'EXTERNAL_LINK';

-- Rename category ورزشی -> ایونت
UPDATE "Event" SET category = 'ایونت' WHERE category = 'ورزشی';

-- Set ticketing type by category
UPDATE "Event" SET "ticketingType" = 'INTERNAL' WHERE category = 'ایونت';
UPDATE "Event" SET "ticketingType" = 'EXTERNAL_LINK' WHERE category IN ('کنسرت', 'تئاتر');
