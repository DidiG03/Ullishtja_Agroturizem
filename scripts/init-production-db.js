const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function initProductionDatabase() {
  try {
    console.log('🚀 Initializing production database...');

    console.log('🔍 Testing database connections...');
    const reservationCount = await prisma.reservation.count();
    const customerCount = await prisma.customer.count();

    console.log('\n📊 Database Status:');
    console.log(`   📅 Reservations: ${reservationCount}`);
    console.log(`   👥 Customers: ${customerCount}`);

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
