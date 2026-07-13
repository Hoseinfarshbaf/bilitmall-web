-- CreateTable
CREATE TABLE "FavoriteEvent" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "eventId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteEvent_userId_eventId_key" ON "FavoriteEvent"("userId", "eventId");

-- CreateIndex
CREATE INDEX "FavoriteEvent_userId_idx" ON "FavoriteEvent"("userId");

-- CreateIndex
CREATE INDEX "FavoriteEvent_eventId_idx" ON "FavoriteEvent"("eventId");

-- AddForeignKey
ALTER TABLE "FavoriteEvent" ADD CONSTRAINT "FavoriteEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "BilitmallUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteEvent" ADD CONSTRAINT "FavoriteEvent_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
