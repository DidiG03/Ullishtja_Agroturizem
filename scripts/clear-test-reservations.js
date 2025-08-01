const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearTestReservations() {
  try {
    
    // First, let's see what reservations exist
    const existingReservations = await prisma.reservation.findMany();
    
    existingReservations.forEach((reservation, index) => {
    });
        
    
  } catch (error) {
    console.error('Error clearing reservations:', error);
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