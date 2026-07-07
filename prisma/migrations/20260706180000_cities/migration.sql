-- CreateTable
CREATE TABLE "City" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "City_name_key" ON "City"("name");

-- CreateIndex
CREATE UNIQUE INDEX "City_slug_key" ON "City"("slug");

-- CreateIndex
CREATE INDEX "City_sortOrder_idx" ON "City"("sortOrder");

-- Seed default cities
INSERT INTO "City" ("name", "slug", "sortOrder", "isPopular", "updatedAt") VALUES
('تهران', 'tehran', 1, true, CURRENT_TIMESTAMP),
('اصفهان', 'isfahan', 2, true, CURRENT_TIMESTAMP),
('شیراز', 'shiraz', 3, true, CURRENT_TIMESTAMP),
('مشهد', 'mashhad', 4, true, CURRENT_TIMESTAMP),
('تبریز', 'tabriz', 5, true, CURRENT_TIMESTAMP),
('کیش', 'kish', 6, false, CURRENT_TIMESTAMP),
('کرج', 'karaj', 7, false, CURRENT_TIMESTAMP),
('اهواز', 'ahvaz', 8, false, CURRENT_TIMESTAMP),
('رشت', 'rasht', 9, false, CURRENT_TIMESTAMP),
('کرمان', 'kerman', 10, false, CURRENT_TIMESTAMP);
