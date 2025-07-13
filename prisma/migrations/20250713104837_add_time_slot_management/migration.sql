-- CreateTable
CREATE TABLE "time_slots" (
    "id" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 120,
    "maxCapacity" INTEGER NOT NULL DEFAULT 20,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_slot_capacities" (
    "id" TEXT NOT NULL,
    "timeSlotId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "maxCapacity" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_slot_capacities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "time_slots_time_key" ON "time_slots"("time");

-- CreateIndex
CREATE UNIQUE INDEX "time_slot_capacities_timeSlotId_dayOfWeek_key" ON "time_slot_capacities"("timeSlotId", "dayOfWeek");

-- AddForeignKey
ALTER TABLE "time_slot_capacities" ADD CONSTRAINT "time_slot_capacities_timeSlotId_fkey" FOREIGN KEY ("timeSlotId") REFERENCES "time_slots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
