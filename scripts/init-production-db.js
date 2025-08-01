const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function initProductionDatabase() {
  try {
    console.log('🚀 Initializing production database...');
    
    // Check if restaurant settings exist
    console.log('📋 Checking restaurant settings...');
    const existingSettings = await prisma.restaurantSettings.findFirst();
    
    if (!existingSettings) {
      console.log('🏪 Creating restaurant settings...');
      await prisma.restaurantSettings.create({
        data: {
          restaurantName: 'Ullishtja Agriturizem',
          email: 'hi@ullishtja-agroturizem.com',
          phone: '+355 68 409 0405',
          address: 'Rruga e Ullishtes, Tirane, Albania',
          websiteUrl: 'https://ullishtja-agroturizem.com',
          maxCapacity: 60,
        },
      });
      console.log('✅ Restaurant settings created');
    } else {
      console.log('✅ Restaurant settings already exist');
    }
    
    // Check if any time slots exist
    console.log('⏰ Checking time slots...');
    const timeSlots = await prisma.timeSlot.findMany();
    
    if (timeSlots.length === 0) {
      console.log('🕐 Creating default time slots...');
      const defaultTimeSlots = [
        { time: '12:00', maxCapacity: 20, displayOrder: 1 },
        { time: '12:30', maxCapacity: 20, displayOrder: 2 },
        { time: '13:00', maxCapacity: 20, displayOrder: 3 },
        { time: '13:30', maxCapacity: 20, displayOrder: 4 },
        { time: '14:00', maxCapacity: 20, displayOrder: 5 },
        { time: '19:00', maxCapacity: 20, displayOrder: 6 },
        { time: '19:30', maxCapacity: 20, displayOrder: 7 },
        { time: '20:00', maxCapacity: 20, displayOrder: 8 },
        { time: '20:30', maxCapacity: 20, displayOrder: 9 },
        { time: '21:00', maxCapacity: 20, displayOrder: 10 },
      ];
      
      for (const slot of defaultTimeSlots) {
        await prisma.timeSlot.create({ data: slot });
      }
      console.log('✅ Time slots created');
    } else {
      console.log('✅ Time slots already exist');
    }
    
    // Check database health
    console.log('🔍 Testing database connections...');
    const reservationCount = await prisma.reservation.count();
    const customerCount = await prisma.customer.count();
    
    console.log('\n📊 Database Status:');
    console.log(`   📅 Reservations: ${reservationCount}`);
    console.log(`   👥 Customers: ${customerCount}`);
    console.log(`   ⏰ Time Slots: ${timeSlots.length}`);
    console.log(`   🏪 Restaurant Settings: ${existingSettings ? 'Configured' : 'Created'}`);
    
    console.log('\n🎉 Production database initialized successfully!');
    console.log('📋 The dashboard API endpoints should now work properly.');
    
  } catch (error) {
    console.error('❌ Error initializing production database:', error);
    console.error('Details:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

initProductionDatabase();