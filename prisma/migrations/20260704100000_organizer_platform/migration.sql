-- CreateTable
CREATE TABLE "Organizer" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "bio" TEXT,
    "coverImage" TEXT NOT NULL DEFAULT '',
    "logoImage" TEXT NOT NULL DEFAULT '',
    "phone" TEXT,
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organizer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizerUser" (
    "id" SERIAL NOT NULL,
    "organizerId" INTEGER NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'owner',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizerUser_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Event" ADD COLUMN "description" TEXT,
ADD COLUMN "organizerId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Organizer_slug_key" ON "Organizer"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizerUser_phone_key" ON "OrganizerUser"("phone");

-- CreateIndex
CREATE INDEX "OrganizerUser_organizerId_idx" ON "OrganizerUser"("organizerId");

-- CreateIndex
CREATE INDEX "Event_organizerId_idx" ON "Event"("organizerId");

-- AddForeignKey
ALTER TABLE "OrganizerUser" ADD CONSTRAINT "OrganizerUser_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "Organizer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "Organizer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
