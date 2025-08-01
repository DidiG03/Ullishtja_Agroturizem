const { createClerkClient } = require('@clerk/backend');
require('dotenv').config();

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

async function getCurrentUser() {
  try {
    console.log('🔍 Getting current Clerk users...');
    
    // Get all users to find the one with your email
    const users = await clerkClient.users.getUserList({ 
      emailAddress: ['sefridkapllani@gmail.com'],
      limit: 10 
    });
    
    console.log('\n📋 Found users:');
    users.data.forEach(user => {
      const email = user.emailAddresses?.find(e => e.emailAddress)?.emailAddress || 'No email';
      console.log(`👤 ${user.firstName} ${user.lastName}`);
      console.log(`   📧 Email: ${email}`);
      console.log(`   🆔 User ID: ${user.id}`);
      console.log(`   📅 Created: ${new Date(user.createdAt).toLocaleDateString()}`);
      console.log('---');
    });
    
    if (users.data.length === 0) {
      console.log('❌ No users found with email sefridkapllani@gmail.com');
      console.log('💡 You might be logged in with a different email');
    }
    
    // Check current admin config
    console.log('\n⚙️  Current admin configuration:');
    console.log(`REACT_APP_ADMIN_USER_IDS: ${process.env.REACT_APP_ADMIN_USER_IDS || 'Not set'}`);
    
  } catch (error) {
    console.error('❌ Error getting users:', error.message);
  }
}

getCurrentUser();