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

-- updatedAt trigger to auto-update timestamp on row modification (PostgreSQL)
DO $$ BEGIN
  CREATE OR REPLACE FUNCTION set_current_timestamp_updated_at_staff()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER set_staff_updated_at
  BEFORE UPDATE ON "staff"
  FOR EACH ROW
  EXECUTE PROCEDURE set_current_timestamp_updated_at_staff();
EXCEPTION
  WHEN others THEN NULL;
END $$;


