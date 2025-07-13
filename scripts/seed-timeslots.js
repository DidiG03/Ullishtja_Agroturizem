const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedTimeSlots() {
  try {
    console.log('🕒 Seeding default time slots...');

    const defaultSlots = [
      { time: '12:00', maxCapacity: 20, displayOrder: 1 },
      { time: '12:30', maxCapacity: 20, displayOrder: 2 },
      { time: '13:00', maxCapacity: 20, displayOrder: 3 },
      { time: '13:30', maxCapacity: 20, displayOrder: 4 },
      { time: '14:00', maxCapacity: 20, displayOrder: 5 },
      { time: '14:30', maxCapacity: 20, displayOrder: 6 },
      { time: '15:00', maxCapacity: 20, displayOrder: 7 },
      { time: '18:00', maxCapacity: 25, displayOrder: 8 },
      { time: '18:30', maxCapacity: 25, displayOrder: 9 },
      { time: '19:00', maxCapacity: 30, displayOrder: 10 },
      { time: '19:30', maxCapacity: 30, displayOrder: 11 },
      { time: '20:00', maxCapacity: 30, displayOrder: 12 },
      { time: '20:30', maxCapacity: 25, displayOrder: 13 },
      { time: '21:00', maxCapacity: 20, displayOrder: 14 },
      { time: '21:30', maxCapacity: 15, displayOrder: 15 },
    ];

    let created = 0;
    let existing = 0;

    for (const slotData of defaultSlots) {
      // Check if slot already exists
      const existingSlot = await prisma.timeSlot.findFirst({
        where: { time: slotData.time },
      });

      if (!existingSlot) {
        await prisma.timeSlot.create({
          data: slotData,
        });
        created++;
        console.log(`✓ Created time slot: ${slotData.time} (capacity: ${slotData.maxCapacity})`);
      } else {
        existing++;
        console.log(`- Time slot already exists: ${slotData.time}`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Created: ${created} time slots`);
    console.log(`   Existing: ${existing} time slots`);
    console.log(`   Total: ${created + existing} time slots`);

    console.log('\n🎉 Time slots seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding time slots:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedTimeSlots(); 