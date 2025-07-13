const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function initializeRestaurantSettings() {
  try {
    console.log('🔧 Initializing restaurant settings...');
    
    // Check if settings already exist
    const existingSettings = await prisma.restaurantSettings.findFirst();
    
    if (existingSettings) {
      console.log('✅ Restaurant settings already exist');
      return;
    }
    
    // Create default settings
    const defaultSettings = await prisma.restaurantSettings.create({
      data: {
        restaurantName: 'Ullishtja Agriturizem',
        email: 'info@ullishtja.com',
        phone: '+355 XX XXX XXX',
        address: 'Rruga e Ullishtes, Tirane, Albania',
        operatingHours: JSON.stringify({
          monday: { open: '12:00', close: '22:00', closed: false },
          tuesday: { open: '12:00', close: '22:00', closed: false },
          wednesday: { open: '12:00', close: '22:00', closed: false },
          thursday: { open: '12:00', close: '22:00', closed: false },
          friday: { open: '12:00', close: '22:00', closed: false },
          saturday: { open: '12:00', close: '22:00', closed: false },
          sunday: { open: '12:00', close: '22:00', closed: false }
        }),
        maxCapacity: 50,
        tableCapacity: JSON.stringify({
          '2': 8,
          '4': 6,
          '6': 4,
          '8': 2
        }),
        emailNotifications: true,
        smsNotifications: false
      }
    });
    
    console.log('✅ Restaurant settings initialized successfully');
    console.log('📝 Settings ID:', defaultSettings.id);
    
  } catch (error) {
    console.error('❌ Error initializing restaurant settings:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the initialization
initializeRestaurantSettings()
  .then(() => {
    console.log('🎉 Restaurant settings initialization completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to initialize restaurant settings:', error);
    process.exit(1);
  }); 