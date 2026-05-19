const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function wipeDatabase() {
  try {
    console.log('🗑️  Starting database wipe...');
    
    // Delete data in reverse order to respect foreign key constraints
    console.log('Deleting admin activities...');
    await prisma.adminActivity.deleteMany();
    
    console.log('Deleting menu items...');
    await prisma.menuItem.deleteMany();
    
    console.log('Deleting menu categories...');
    await prisma.menuCategory.deleteMany();
    
    console.log('Deleting reservations...');
    await prisma.reservation.deleteMany();
    
    console.log('Deleting reviews...');
    await prisma.review.deleteMany();
    
    console.log('Deleting gallery images...');
    await prisma.galleryImage.deleteMany();
    
    console.log('Deleting events...');
    await prisma.event.deleteMany();
    
    console.log('Deleting customers...');
    await prisma.customer.deleteMany();
    
    console.log('✅ Database wiped successfully!');
    console.log('📊 All tables are now empty and ready for fresh data.');
    
  } catch (error) {
    console.error('❌ Error wiping database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  wipeDatabase()
    .then(() => {
      console.log('🎉 Database wipe completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database wipe failed:', error);
      process.exit(1);
    });
}

module.exports = { wipeDatabase };