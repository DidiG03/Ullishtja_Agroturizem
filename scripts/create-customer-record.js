const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createCustomerRecord() {
  try {

    // Log admin activity
    await prisma.adminActivity.create({
      data: {
        adminId: 'user_2ykO4m5sAsomrUzDAAjp7ZLal3u',
        adminName: 'Sefrid Kapllani',
        action: 'USER_CREATED',
        entityType: 'User',
        entityId: 'user_2ykO4m5sAsomrUzDAAjp7ZLal3u',
        details: JSON.stringify({
          email: 'sefridkapllani@gmail.com',
          method: 'script',
          timestamp: new Date().toISOString()
        }),
        ipAddress: 'localhost',
        userAgent: 'Node.js script'
      }
    });
    
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('Customer record already exists - that\'s okay!');
    } else {
      console.error('❌ Error creating customer record:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createCustomerRecord(); 