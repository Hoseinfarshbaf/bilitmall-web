-- AlterTable
ALTER TABLE "Event" ADD COLUMN "venueTemplateId" INTEGER;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_venueTemplateId_fkey" FOREIGN KEY ("venueTemplateId") REFERENCES "VenueTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Event_venueTemplateId_idx" ON "Event"("venueTemplateId");
