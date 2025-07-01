# Admin User Creation Guide

## Overview
This guide will help you create an admin user with the email `sefridkapllani@gmail.com` and password `Sefrid2003?` in both Clerk (for authentication) and your local database (for customer records).

## Prerequisites
✅ Clerk application created
✅ Database schema migrated
✅ Environment variables configured

## Step 1: Get Your Clerk Keys

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Go to **API Keys** section
4. Copy your **Publishable Key** (starts with `pk_test_`)
5. Copy your **Secret Key** (starts with `sk_test_`)

## Step 2: Update Environment Variables

Update your `.env` file with your actual Clerk keys:

```bash
# Replace these placeholder values with your actual keys
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_actual_secret_key_here

# This will be updated after user creation
REACT_APP_ADMIN_USER_IDS=user_your_admin_user_id_here

# Database
DATABASE_URL="file:./dev.db"
```

## Step 3: Create the Admin User

### Option A: Using the Automated Script (Recommended)

Run the automated script to create the user:

```bash
node scripts/create-admin-user.js
```

This script will:
- ✅ Create the user in Clerk with email `sefridkapllani@gmail.com`
- ✅ Set the password to `Sefrid2003?`
- ✅ Create a customer record in your database
- ✅ Log the admin activity
- ✅ Provide you with the User ID to add to your environment variables

### Option B: Manual Creation via Clerk Dashboard

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Go to **Users** section
4. Click **Create User**
5. Fill in the details:
   - **Email**: `sefridkapllani@gmail.com`
   - **First Name**: `Sefrid`
   - **Last Name**: `Kapllani`
   - **Password**: `Sefrid2003?`
6. Click **Create User**
7. Copy the User ID (starts with `user_`)

## Step 4: Update Environment Variables with User ID

After creating the user, update your `.env` file:

```bash
# Replace with the actual User ID from Clerk
REACT_APP_ADMIN_USER_IDS=user_2abc123def456ghi789jkl
```

For multiple admins, separate with commas:
```bash
REACT_APP_ADMIN_USER_IDS=user_2abc123def456ghi789jkl,user_2xyz987uvw654rst321mno
```

## Step 5: Create Database Customer Record (If using Manual Creation)

If you used the manual method, run this script to create the customer record:

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createCustomer() {
  try {
    const customer = await prisma.customer.create({
      data: {
        name: 'Sefrid Kapllani',
        email: 'sefridkapllani@gmail.com',
        clerkUserId: 'YOUR_USER_ID_HERE', // Replace with actual user ID
        notes: 'Admin user account',
        preferences: {
          role: 'admin',
          createdBy: 'manual'
        }
      }
    });
    console.log('Customer created:', customer);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.\$disconnect();
  }
}
createCustomer();
"
```

## Step 6: Test the Admin Login

1. Start your development server:
```bash
npm start
```

2. Navigate to `/admin-login`

3. Login with:
   - **Email**: `sefridkapllani@gmail.com`
   - **Password**: `Sefrid2003?`

4. You should be redirected to `/dashboard`

## Troubleshooting

### User Already Exists Error
If you get an error that the user already exists:
1. Go to Clerk Dashboard > Users
2. Search for `sefridkapllani@gmail.com`
3. Either use the existing user ID or delete the user and try again

### Authentication Errors
1. Check that your Clerk keys are correct in `.env`
2. Restart your development server after updating environment variables
3. Clear browser cache and cookies

### Database Errors
1. Make sure your database is migrated: `npx prisma migrate dev`
2. Check that Prisma client is generated: `npx prisma generate`

## Security Notes

🔒 **Important Security Considerations:**
- Never commit your `.env` file to version control
- Use strong passwords for production
- Regularly rotate your Clerk secret keys
- Monitor admin activity logs
- Consider enabling 2FA for production admin accounts

## Next Steps

After successful creation:
1. ✅ Test the admin login functionality
2. ✅ Verify dashboard access
3. ✅ Check database records
4. ✅ Set up additional admin users if needed
5. ✅ Configure production environment with secure keys

## Admin User Details

- **Email**: `sefridkapllani@gmail.com`
- **Password**: `Sefrid2003?`
- **Name**: Sefrid Kapllani
- **Role**: Admin
- **Dashboard Access**: `/dashboard`
- **Login URL**: `/admin-login`

---

🎉 **Congratulations!** Your admin user is now ready to use the Ullishtja Agroturizem admin system. 