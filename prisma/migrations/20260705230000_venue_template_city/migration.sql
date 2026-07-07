-- AlterTable
ALTER TABLE "VenueTemplate" ADD COLUMN "city" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX "VenueTemplate_city_idx" ON "VenueTemplate"("city");

-- Backfill seed template
UPDATE "VenueTemplate" SET "city" = 'تهران' WHERE "slug" = 'standard-8x12' AND "city" = '';
