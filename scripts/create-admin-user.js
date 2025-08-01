const { createClerkClient } = require('@clerk/backend');
const { PrismaClient } = require('@prisma/client');

// Load environment variables
require('dotenv').config();

const prisma = new PrismaClient();

// Initialize Clerk client with secret key
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

async function createAdminUser() {
  try {
    
    // Check if Clerk secret key is set
    if (!process.env.CLERK_SECRET_KEY || process.env.CLERK_SECRET_KEY === 'sk_test_your_secret_key_here') {
      console.error('❌ CLERK_SECRET_KEY not found in environment variables.');
      process.exit(1);
    }

    // Get admin details from environment variables
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const firstName = process.env.ADMIN_FIRST_NAME || 'Admin';
    const lastName = process.env.ADMIN_LAST_NAME || 'User';

    if (!email || !password) {
      console.error('❌ Missing admin credentials. Please set ADMIN_EMAIL and ADMIN_PASSWORD environment variables.');
      process.exit(1);
    }

    // Create user in Clerk
    const user = await clerkClient.users.createUser({
      emailAddress: [email],
      password: password,
      firstName: firstName,
      lastName: lastName,
      skipPasswordChecks: false,
      skipPasswordRequirement: false,
    });

    // Create customer record in database
    const customer = await prisma.customer.create({
      data: {
        name: `${firstName} ${lastName}`,
        email: email,
        clerkUserId: user.id,
        notes: 'Admin user account',
        preferences: JSON.stringify({
          role: 'admin',
          createdBy: 'script'
        })
      }
    });

    // Log admin activity
    await prisma.adminActivity.create({
      data: {
        adminId: user.id,
        adminName: `${firstName} ${lastName}`,
        action: 'USER_CREATED',
        entityType: 'User',
        entityId: user.id,
        details: JSON.stringify({
          email: email,
          method: 'script',
          timestamp: new Date().toISOString()
        }),
        ipAddress: 'localhost',
        userAgent: 'Node.js script'
      }
    });


  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    
    if (error.errors) {
      console.error('Detailed errors:', error.errors);
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createAdminUser(); 