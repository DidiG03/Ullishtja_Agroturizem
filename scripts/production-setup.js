const { createClerkClient } = require('@clerk/backend');
const { PrismaClient } = require('@prisma/client');

// Load environment variables
require('dotenv').config();

const prisma = new PrismaClient();

async function setupProduction() {
  try {

    
    // 1. Validate environment variables
    console.log('\n📋 Checking environment variables...');
    
    const requiredVars = [
      'CLERK_SECRET_KEY',
      'REACT_APP_CLERK_PUBLISHABLE_KEY', 
      'DATABASE_URL',
      'ADMIN_EMAIL',
      'ADMIN_PASSWORD'
    ];
    
    const missing = [];
    const warnings = [];
    
    for (const varName of requiredVars) {
      const value = process.env[varName];
      if (!value) {
        missing.push(varName);
      } else if (varName === 'CLERK_SECRET_KEY' && value.startsWith('sk_test_')) {
        warnings.push(`⚠️  ${varName} appears to be a test key (starts with sk_test_). Production should use sk_live_`);
      } else if (varName === 'REACT_APP_CLERK_PUBLISHABLE_KEY' && value.startsWith('pk_test_')) {
        warnings.push(`⚠️  ${varName} appears to be a test key (starts with pk_test_). Production should use pk_live_`);
      }
    }
    
    if (missing.length > 0) {
      console.error('❌ Missing required environment variables:');
      missing.forEach(varName => console.error(`   - ${varName}`));
      console.error('\nPlease set these variables in your .env file or environment.');
      process.exit(1);
    }
    
    if (warnings.length > 0) {
      console.warn('\n⚠️  Environment warnings:');
      warnings.forEach(warning => console.warn(`   ${warning}`));
    }
    
    console.log('✅ Environment variables validated');
    
    // 2. Test Clerk connection
    console.log('\n🔐 Testing Clerk connection...');
    
    const clerkClient = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    
    try {
      // Test the connection by trying to list users (limit to 1)
      await clerkClient.users.getUserList({ limit: 1 });
      console.log('✅ Clerk connection successful');
      
      const keyType = process.env.CLERK_SECRET_KEY.startsWith('sk_live_') ? 'PRODUCTION' : 'TEST';
      console.log(`📊 Using ${keyType} Clerk environment`);
      
    } catch (clerkError) {
      console.error('❌ Clerk connection failed:', clerkError.message);
      process.exit(1);
    }
    
    // 3. Test database connection
    console.log('\n💾 Testing database connection...');
    
    try {
      await prisma.$connect();
      console.log('✅ Database connection successful');
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError.message);
      process.exit(1);
    }
    
    // 4. Create admin user
    console.log('\n👑 Creating admin user...');
    
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const firstName = process.env.ADMIN_FIRST_NAME || 'Admin';
    const lastName = process.env.ADMIN_LAST_NAME || 'User';
    
    // Check if admin user already exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { email: email }
    });
    
    if (existingCustomer) {
      console.log('✅ Admin user already exists in database');
      
      // Check if user exists in Clerk
      try {
        const clerkUsers = await clerkClient.users.getUserList({
          emailAddress: [email]
        });
        
        if (clerkUsers.data.length > 0) {
          console.log('✅ Admin user already exists in Clerk');
          console.log(`📋 Admin User ID: ${clerkUsers.data[0].id}`);
        } else {
          console.log('⚠️  Admin user exists in database but not in Clerk. This may cause login issues.');
        }
      } catch (error) {
        console.log('⚠️  Could not verify Clerk user existence:', error.message);
      }
    } else {
      // Create new admin user
      try {
        // Create user in Clerk
        const user = await clerkClient.users.createUser({
          emailAddress: [email],
          password: password,
          firstName: firstName,
          lastName: lastName,
          skipPasswordChecks: false,
          skipPasswordRequirement: false,
        });
        
        console.log('✅ Admin user created in Clerk');
        console.log(`📋 Admin User ID: ${user.id}`);
        
        // Create customer record in database
        const customer = await prisma.customer.create({
          data: {
            name: `${firstName} ${lastName}`,
            email: email,
            clerkUserId: user.id,
            notes: 'Admin user account',
            preferences: JSON.stringify({
              role: 'admin',
              createdBy: 'production-setup-script'
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
              method: 'production-setup-script',
              timestamp: new Date().toISOString()
            }),
            ipAddress: 'localhost',
            userAgent: 'Node.js production setup script'
          }
        });
        
        console.log('✅ Admin user created in database');
        console.log('✅ Admin activity logged');
        
      } catch (error) {
        if (error.errors && error.errors.some(e => e.code === 'form_identifier_exists')) {
          console.log('⚠️  Admin user already exists in Clerk but not in database. Linking existing user...');
          
          // Get existing Clerk user
          const clerkUsers = await clerkClient.users.getUserList({
            emailAddress: [email]
          });
          
          if (clerkUsers.data.length > 0) {
            const existingUser = clerkUsers.data[0];
            
            // Create customer record for existing Clerk user
            const customer = await prisma.customer.create({
              data: {
                name: `${firstName} ${lastName}`,
                email: email,
                clerkUserId: existingUser.id,
                notes: 'Admin user account - linked existing Clerk user',
                preferences: JSON.stringify({
                  role: 'admin',
                  createdBy: 'production-setup-script'
                })
              }
            });
            
            console.log('✅ Existing Clerk user linked to database');
            console.log(`📋 Admin User ID: ${existingUser.id}`);
          }
        } else {
          throw error;
        }
      }
    }
    
    console.log('\n🎉 Production setup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Add your admin user ID to REACT_APP_ADMIN_USER_IDS environment variable');
    console.log('2. Deploy your application');
    console.log('3. Test admin login functionality');
    console.log('4. The Clerk development warning should now be gone');
    
  } catch (error) {
    console.error('\n💥 Production setup failed:', error);
    
    if (error.errors) {
      console.error('Detailed errors:', error.errors);
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  setupProduction();
}

module.exports = { setupProduction };