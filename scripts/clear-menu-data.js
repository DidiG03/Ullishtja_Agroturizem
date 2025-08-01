const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearMenuData() {
  try {
    console.log('🗑️  Clearing existing menu data...');
    
    // Clear menu items first (due to foreign key constraints)
    console.log('📄 Deleting menu items...');
    const deletedItems = await prisma.menuItem.deleteMany();
    console.log(`   ✅ Deleted ${deletedItems.count} menu items`);
    
    // Clear menu categories
    console.log('📂 Deleting menu categories...');
    const deletedCategories = await prisma.menuCategory.deleteMany();
    console.log(`   ✅ Deleted ${deletedCategories.count} menu categories`);
    
    console.log('\n🎉 Menu data cleared successfully!');
    console.log('📋 Your website menu section will now be blank until you add items via admin dashboard.');
    console.log('💡 To add menu items:');
    console.log('   1. Go to https://ullishtja-agroturizem.com/dashboard');
    console.log('   2. Click "Menu" in the sidebar');
    console.log('   3. Create categories and add menu items');
    
  } catch (error) {
    console.error('❌ Error clearing menu data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

clearMenuData();