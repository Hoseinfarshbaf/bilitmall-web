-- VenueTemplate: source tracking
ALTER TABLE "VenueTemplate" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'admin';
ALTER TABLE "VenueTemplate" ADD COLUMN "organizerId" INTEGER;
ALTER TABLE "VenueTemplate" ADD COLUMN "sourceSeatingPlanId" INTEGER;
CREATE UNIQUE INDEX "VenueTemplate_sourceSeatingPlanId_key" ON "VenueTemplate"("sourceSeatingPlanId");
CREATE INDEX "VenueTemplate_source_idx" ON "VenueTemplate"("source");
ALTER TABLE "VenueTemplate" ADD CONSTRAINT "VenueTemplate_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "MyEventOrganizer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- EventSeatingPlan: approval workflow
ALTER TABLE "EventSeatingPlan" ADD COLUMN "approvalStatus" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "EventSeatingPlan" ADD COLUMN "promotedVenueTemplateId" INTEGER;
CREATE INDEX "EventSeatingPlan_approvalStatus_idx" ON "EventSeatingPlan"("approvalStatus");
