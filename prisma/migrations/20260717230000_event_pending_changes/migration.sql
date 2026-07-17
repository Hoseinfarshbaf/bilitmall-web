-- AlterTable
ALTER TABLE "Event" ADD COLUMN "firstApprovedAt" TIMESTAMP(3);
ALTER TABLE "Event" ADD COLUMN "hasPendingChanges" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Event" ADD COLUMN "pendingEventChanges" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Event" ADD COLUMN "pendingVenueChanges" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Event" ADD COLUMN "pendingChangesAt" TIMESTAMP(3);

-- Backfill: currently live My Event events were already approved once
UPDATE "Event"
SET "firstApprovedAt" = COALESCE("updatedAt", "createdAt")
WHERE "source" = 'my_event'
  AND "status" = 'active'
  AND "published" = true
  AND "firstApprovedAt" IS NULL;
