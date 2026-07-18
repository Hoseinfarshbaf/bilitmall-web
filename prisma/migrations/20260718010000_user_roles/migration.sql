-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_slug_key" ON "Role"("slug");

-- Seed system roles
INSERT INTO "Role" ("slug", "name", "description", "isSystem", "updatedAt") VALUES
  ('user', 'کاربر بلیت‌مال', 'خریدار عادی سایت بلیت‌مال', true, CURRENT_TIMESTAMP),
  ('manager', 'مدیر', 'مدیر داخلی بلیت‌مال', true, CURRENT_TIMESTAMP),
  ('admin', 'ادمین', 'دسترسی کامل پنل ادمین', true, CURRENT_TIMESTAMP),
  ('organizer', 'برگزارکننده', 'برگزارکننده رویداد (شامل حساب My Event)', true, CURRENT_TIMESTAMP);

-- AlterTable BilitmallUser
ALTER TABLE "BilitmallUser" ADD COLUMN "roleId" INTEGER;

UPDATE "BilitmallUser"
SET "roleId" = (SELECT "id" FROM "Role" WHERE "slug" = 'user' LIMIT 1)
WHERE "roleId" IS NULL;

ALTER TABLE "BilitmallUser" ALTER COLUMN "roleId" SET NOT NULL;

CREATE INDEX "BilitmallUser_roleId_idx" ON "BilitmallUser"("roleId");

ALTER TABLE "BilitmallUser"
ADD CONSTRAINT "BilitmallUser_roleId_fkey"
FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable MyEventUser: replace string role with roleId
ALTER TABLE "MyEventUser" ADD COLUMN "roleId" INTEGER;

UPDATE "MyEventUser"
SET "roleId" = (SELECT "id" FROM "Role" WHERE "slug" = 'organizer' LIMIT 1)
WHERE "roleId" IS NULL;

ALTER TABLE "MyEventUser" ALTER COLUMN "roleId" SET NOT NULL;

ALTER TABLE "MyEventUser" DROP COLUMN "role";

CREATE INDEX "MyEventUser_roleId_idx" ON "MyEventUser"("roleId");

ALTER TABLE "MyEventUser"
ADD CONSTRAINT "MyEventUser_roleId_fkey"
FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
