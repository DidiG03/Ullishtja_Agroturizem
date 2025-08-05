-- AlterTable
ALTER TABLE "restaurant_settings" ALTER COLUMN "email" SET DEFAULT 'hi@ullishtja-agroturizem.com';

-- CreateTable
CREATE TABLE "blog_categories" (
    "id" TEXT NOT NULL,
    "nameAL" TEXT NOT NULL,
    "nameEN" TEXT NOT NULL,
    "nameIT" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descriptionAL" TEXT,
    "descriptionEN" TEXT,
    "descriptionIT" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_posts" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titleAL" TEXT NOT NULL,
    "titleEN" TEXT NOT NULL,
    "titleIT" TEXT NOT NULL,
    "excerptAL" TEXT,
    "excerptEN" TEXT,
    "excerptIT" TEXT,
    "contentAL" TEXT NOT NULL,
    "contentEN" TEXT NOT NULL,
    "contentIT" TEXT NOT NULL,
    "metaDescriptionAL" TEXT,
    "metaDescriptionEN" TEXT,
    "metaDescriptionIT" TEXT,
    "metaKeywordsAL" TEXT,
    "metaKeywordsEN" TEXT,
    "metaKeywordsIT" TEXT,
    "featuredImageUrl" TEXT,
    "featuredImageAlt" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "authorName" TEXT NOT NULL DEFAULT 'Ullishtja Agroturizem',
    "authorId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_images" (
    "id" TEXT NOT NULL,
    "blogPostId" TEXT,
    "title" TEXT,
    "altText" TEXT,
    "imageUrl" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "blog_categories_slug_key" ON "blog_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_slug_key" ON "blog_posts"("slug");

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "blog_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_images" ADD CONSTRAINT "blog_images_blogPostId_fkey" FOREIGN KEY ("blogPostId") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
