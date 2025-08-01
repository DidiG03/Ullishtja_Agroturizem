const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function finishSetup() {
  try {
    
    
    const customer = await prisma.customer.create({
      data: {
        name: 'Sefrid Kapllani',
        email: 'sefridkapllani@gmail.com',
        clerkUserId: 'user_2ykOSSFThqzpVrBpjDQT0oAfssT',
        notes: 'Admin user account',
        preferences: JSON.stringify({
          role: 'admin',
          createdBy: 'script'
        })
      }
    });

    
    
    await prisma.adminActivity.create({
      data: {
        adminId: 'user_2ykOSSFThqzpVrBpjDQT0oAfssT',
        adminName: 'Sefrid Kapllani',
        action: 'USER_CREATED',
        entityType: 'User',
        entityId: 'user_2ykOSSFThqzpVrBpjDQT0oAfssT',
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
      console.error('Error:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

finishSetup(); 