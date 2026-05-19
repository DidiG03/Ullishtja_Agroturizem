const { createClerkClient } = require('@clerk/backend');
const { PrismaClient } = require('@prisma/client');

// Load .env.local first (dev overrides), then .env
require('dotenv').config({ path: '.env.local' });
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

    let user;

    try {
      user = await clerkClient.users.createUser({
        emailAddress: [email],
        password: password,
        firstName: firstName,
        lastName: lastName,
        skipPasswordChecks: false,
        skipPasswordRequirement: false,
      });
      console.log('✅ Created new Clerk user');
    } catch (createError) {
      const alreadyExists = createError.errors?.some(
        (e) => e.code === 'form_identifier_exists'
      );
      if (!alreadyExists) throw createError;

      const existing = await clerkClient.users.getUserList({
        emailAddress: [email],
        limit: 1,
      });
      if (!existing.data.length) throw createError;

      user = existing.data[0];
      console.log('ℹ️  User already exists in Clerk — using existing account');
    }

    console.log('\n📋 Add this to .env.local:\n');
    console.log(`REACT_APP_ADMIN_USER_IDS=${user.id}\n`);

    // Create customer record in database (skip if already linked)
    const existingCustomer = await prisma.customer.findFirst({
      where: { OR: [{ clerkUserId: user.id }, { email }] },
    });
    if (!existingCustomer) {
      await prisma.customer.create({
        data: {
          name: `${firstName} ${lastName}`,
          email: email,
          clerkUserId: user.id,
          notes: 'Admin user account',
          preferences: JSON.stringify({
            role: 'admin',
            createdBy: 'script',
          }),
        },
      });
    }

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

    console.log('✅ Done. Restart dev server: npm run start:prod-data');
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