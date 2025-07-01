-- Clear existing menu data to prevent conflicts
DELETE FROM "menu_items";
DELETE FROM "menu_categories";

-- DropIndex
DROP INDEX "menu_categories_name_key";

-- AlterTable
ALTER TABLE "menu_categories" DROP COLUMN "description",
DROP COLUMN "name",
DROP COLUMN "nameAlbanian",
DROP COLUMN "nameItalian",
ADD COLUMN     "nameAL" TEXT NOT NULL,
ADD COLUMN     "nameEN" TEXT NOT NULL,
ADD COLUMN     "nameIT" TEXT NOT NULL,
ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "menu_items" DROP COLUMN "description",
DROP COLUMN "descriptionAlbanian",
DROP COLUMN "descriptionItalian",
DROP COLUMN "isAvailable",
DROP COLUMN "isVegan",
DROP COLUMN "name",
DROP COLUMN "nameAlbanian",
DROP COLUMN "nameItalian",
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'ALL',
ADD COLUMN     "descriptionAL" TEXT,
ADD COLUMN     "descriptionEN" TEXT,
ADD COLUMN     "descriptionIT" TEXT,
ADD COLUMN     "ingredientsAL" TEXT,
ADD COLUMN     "ingredientsEN" TEXT,
ADD COLUMN     "ingredientsIT" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isNew" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isRecommended" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSpicy" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nameAL" TEXT NOT NULL,
ADD COLUMN     "nameEN" TEXT NOT NULL,
ADD COLUMN     "nameIT" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "menu_categories_slug_key" ON "menu_categories"("slug");
