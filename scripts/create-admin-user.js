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
    console.log('🚀 Starting admin user creation process...');
    
    // Check if Clerk secret key is set
    if (!process.env.CLERK_SECRET_KEY || process.env.CLERK_SECRET_KEY === 'sk_test_your_secret_key_here') {
      console.error('❌ CLERK_SECRET_KEY not found in environment variables.');
      console.log('📝 Please add your Clerk Secret Key to the .env file:');
      console.log('   1. Go to https://dashboard.clerk.com');
      console.log('   2. Select your application');
      console.log('   3. Go to API Keys');
      console.log('   4. Copy the Secret Key');
      console.log('   5. Update CLERK_SECRET_KEY in .env file');
      process.exit(1);
    }

    const email = 'sefridkapllani@gmail.com';
    const password = 'Sefrid2003?';
    const firstName = 'Sefrid';
    const lastName = 'Kapllani';

    console.log(`📧 Creating user with email: ${email}`);

    // Create user in Clerk
    const user = await clerkClient.users.createUser({
      emailAddress: [email],
      password: password,
      firstName: firstName,
      lastName: lastName,
      skipPasswordChecks: false,
      skipPasswordRequirement: false,
    });

    console.log('✅ User created successfully in Clerk!');
    console.log(`👤 User ID: ${user.id}`);
    console.log(`📧 Email: ${user.emailAddresses[0].emailAddress}`);
    console.log(`👤 Name: ${user.firstName} ${user.lastName}`);

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

    console.log('✅ Customer record created in database!');
    console.log(`🗄️  Customer ID: ${customer.id}`);

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

    console.log('📝 Admin activity logged successfully!');

    // Update environment variables instruction
    console.log('\n🔧 NEXT STEPS:');
    console.log('1. Update your .env file with the following:');
    console.log(`   REACT_APP_ADMIN_USER_IDS=${user.id}`);
    console.log('\n2. If you have multiple admins, separate IDs with commas:');
    console.log(`   REACT_APP_ADMIN_USER_IDS=${user.id},user_id2,user_id3`);
    console.log('\n3. Restart your development server to apply changes');
    console.log('\n✨ Admin user setup complete!');
    console.log(`🔐 You can now login at /admin-login with:`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    
    if (error.errors) {
      console.error('Detailed errors:', error.errors);
    }
    
    // Common error messages
    if (error.message.includes('already exists')) {
      console.log('\n💡 The user already exists. You can:');
      console.log('1. Use the existing account');
      console.log('2. Try with a different email');
      console.log('3. Delete the existing user from Clerk Dashboard and try again');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createAdminUser(); 