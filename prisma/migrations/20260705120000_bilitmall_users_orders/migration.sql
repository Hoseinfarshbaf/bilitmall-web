-- CreateTable
CREATE TABLE "BilitmallUser" (
    "id" SERIAL NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BilitmallUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketOrder" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "eventId" INTEGER NOT NULL,
    "eventTitle" TEXT NOT NULL,
    "eventSlug" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "amountRial" INTEGER NOT NULL DEFAULT 0,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "sessionDate" TEXT,
    "sessionTime" TEXT,
    "status" TEXT NOT NULL DEFAULT 'paid',
    "paymentRef" TEXT,
    "paymentMethod" TEXT NOT NULL DEFAULT 'online',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BilitmallUser_phone_key" ON "BilitmallUser"("phone");

-- CreateIndex
CREATE INDEX "TicketOrder_userId_idx" ON "TicketOrder"("userId");

-- CreateIndex
CREATE INDEX "TicketOrder_eventId_idx" ON "TicketOrder"("eventId");

-- AddForeignKey
ALTER TABLE "TicketOrder" ADD CONSTRAINT "TicketOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "BilitmallUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketOrder" ADD CONSTRAINT "TicketOrder_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
