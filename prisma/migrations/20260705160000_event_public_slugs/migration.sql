-- AlterTable
ALTER TABLE "Event" ADD COLUMN "publicEventSlug" TEXT;
ALTER TABLE "Event" ADD COLUMN "publicCitySlug" TEXT;

-- Backfill from title/city for existing my_event rows (best-effort; app regenerates on edit)
UPDATE "Event"
SET
  "publicEventSlug" = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(title, '[^a-zA-Z0-9\u0600-\u06FF\s]', '', 'g'), '\s+', '', 'g')),
  "publicCitySlug" = CASE city
    WHEN 'تهران' THEN 'tehran'
    WHEN 'اصفهان' THEN 'isfahan'
    WHEN 'شیراز' THEN 'shiraz'
    WHEN 'تبریز' THEN 'tabriz'
    WHEN 'مشهد' THEN 'mashhad'
    WHEN 'کیش' THEN 'kish'
    WHEN 'کرج' THEN 'karaj'
    WHEN 'اهواز' THEN 'ahvaz'
    WHEN 'رشت' THEN 'rasht'
    WHEN 'کرمان' THEN 'kerman'
    ELSE 'tehran'
  END
WHERE source = 'my_event' AND "publicEventSlug" IS NULL;
