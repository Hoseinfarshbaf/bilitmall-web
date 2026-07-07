-- CreateTable
CREATE TABLE "VenueTemplate" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "layout" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VenueTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventSeatingPlan" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "layout" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventSeatingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VenueTemplate_slug_key" ON "VenueTemplate"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "EventSeatingPlan_eventId_key" ON "EventSeatingPlan"("eventId");

-- AddForeignKey
ALTER TABLE "EventSeatingPlan" ADD CONSTRAINT "EventSeatingPlan_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed default venue template
INSERT INTO "VenueTemplate" ("name", "slug", "isDefault", "layout", "updatedAt")
VALUES (
  'سالن استاندارد ۸×۱۲',
  'standard-8x12',
  true,
  '{"name":"سالن استاندارد ۸×۱۲","rows":8,"cols":12,"stagePosition":"top","stageLabel":"صحنه اجرا","defaultPriceRial":350000,"cells":[]}',
  CURRENT_TIMESTAMP
);
