-- Add isKg flag to menu_items
ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "isKg" BOOLEAN NOT NULL DEFAULT FALSE;

