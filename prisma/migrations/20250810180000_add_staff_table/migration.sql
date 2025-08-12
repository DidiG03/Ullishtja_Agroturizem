-- CreateTable
CREATE TABLE IF NOT EXISTS "staff" (
  "id" TEXT PRIMARY KEY,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "posPin" TEXT NOT NULL UNIQUE,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for quick alphabetical listing
CREATE INDEX IF NOT EXISTS "staff_lastName_firstName_idx" ON "staff" ("lastName", "firstName");


