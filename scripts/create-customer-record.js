const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createCustomerRecord() {
  try {
    console.log('🗄️  Creating customer record in database...');
    
    const customer = await prisma.customer.create({
      data: {
        name: 'Sefrid Kapllani',
        email: 'sefridkapllani@gmail.com',
        clerkUserId: 'user_2ykO4m5sAsomrUzDAAjp7ZLal3u',
        notes: 'Admin user account',
        preferences: JSON.stringify({
          role: 'admin',
          createdBy: 'script'
        })
      }
    });

    console.log('✅ Customer record created successfully!');
    console.log('🗄️  Customer ID:', customer.id);
    
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

    console.log('📝 Admin activity logged successfully!');
    console.log('');
    console.log('🎉 SETUP COMPLETE!');
    console.log('');
    console.log('🔐 Admin Login Details:');
    console.log('   Email: sefridkapllani@gmail.com');
    console.log('   Password: Sefrid2003?');
    console.log('   User ID: user_2ykO4m5sAsomrUzDAAjp7ZLal3u');
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('1. Start your development server: npm start');
    console.log('2. Go to /admin-login');
    console.log('3. Login with the credentials above');
    console.log('4. You will be redirected to /dashboard');
    
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('✅ Customer record already exists - that\'s okay!');
      console.log('🎉 SETUP COMPLETE!');
      console.log('');
      console.log('🔐 Admin Login Details:');
      console.log('   Email: sefridkapllani@gmail.com');
      console.log('   Password: Sefrid2003?');
      console.log('   User ID: user_2ykO4m5sAsomrUzDAAjp7ZLal3u');
    } else {
      console.error('❌ Error creating customer record:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createCustomerRecord(); 