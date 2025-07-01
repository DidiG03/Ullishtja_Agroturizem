const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearTestReservations() {
  try {
    console.log('🧹 Clearing test reservations...');
    
    // First, let's see what reservations exist
    const existingReservations = await prisma.reservation.findMany();
    console.log(`📋 Found ${existingReservations.length} reservations:`);
    
    existingReservations.forEach((reservation, index) => {
      console.log(`   ${index + 1}. ${reservation.name} (${reservation.email}) - ${reservation.status}`);
    });
    
    // Delete all existing reservations (since these appear to be test data)
    const deleteResult = await prisma.reservation.deleteMany({});
    
    console.log(`✅ Deleted ${deleteResult.count} reservations`);
    console.log('🎉 Test reservations cleared successfully!');
    
  } catch (error) {
    console.error('❌ Error clearing reservations:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  clearTestReservations().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { clearTestReservations }; 