ALTER TABLE "restaurants"
  ADD COLUMN "addressLine" TEXT,
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "concept" TEXT,
  ADD COLUMN "openingHoursJson" JSONB,
  ADD COLUMN "galleryImagesJson" JSONB,
  ADD COLUMN "orderingMode" TEXT NOT NULL DEFAULT 'browsing-only';
