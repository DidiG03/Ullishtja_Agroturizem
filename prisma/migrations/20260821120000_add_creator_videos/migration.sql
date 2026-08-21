-- CreateTable
CREATE TABLE "creator_videos" (
    "id" TEXT NOT NULL,
    "creatorName" TEXT NOT NULL,
    "handle" TEXT,
    "caption" TEXT,
    "videoUrl" TEXT NOT NULL,
    "posterUrl" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creator_videos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "creator_videos_isActive_displayOrder_idx" ON "creator_videos"("isActive", "displayOrder");
