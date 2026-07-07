-- AlterTable
ALTER TABLE "VenueTemplate" ADD COLUMN "address" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Event" ADD COLUMN "placeAddress" TEXT;
