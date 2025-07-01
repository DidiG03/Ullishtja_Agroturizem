# Admin User Setup Instructions

## Step 1: Create Your Admin User in Clerk

Since we're using a custom login form without sign-up functionality, you need to create your admin user manually in the Clerk Dashboard.

### 1. Go to Clerk Dashboard
1. Visit [https://dashboard.clerk.com](https://dashboard.clerk.com)
2. Sign in to your account
3. Select your application

### 2. Create Admin User
1. Go to **"Users"** in the left sidebar
2. Click **"Create user"** 
3. Fill in the details:
   - **Email**: `admin@ullishtja.com` (or your preferred admin email)
   - **Password**: Create a strong password (you'll use this to log in)
   - **First name**: Admin
   - **Last name**: User (optional)

### 3. Get Your User ID
1. After creating the user, click on the user in the list
2. Copy the **User ID** (starts with `user_...`)
3. Update your `.env` file:

```
REACT_APP_CLERK_PUBLISHABLE_KEY=your_clerk_key_here
REACT_APP_ADMIN_USER_IDS=user_your_copied_user_id_here
```

## Step 2: Test Your Custom Login

1. Restart your development server: `npm start`
2. Go to `http://localhost:3000/admin-login`
3. Use the email and password you created in Clerk
4. You should be redirected to the dashboard after successful login

## Step 3: Multiple Admin Users (Optional)

To add more admin users:
1. Create additional users in Clerk Dashboard
2. Copy their User IDs
3. Add them to your `.env` file separated by commas:

```
REACT_APP_ADMIN_USER_IDS=user_first_admin_id,user_second_admin_id,user_third_admin_id
```

## Features of Your Custom Login:

✅ **Custom Design**: Matches your restaurant's branding  
✅ **No Sign-up**: Only login functionality  
✅ **Secure**: Uses Clerk's authentication backend  
✅ **Error Handling**: Shows clear error messages  
✅ **Loading States**: Visual feedback during login  
✅ **Responsive**: Works on all devices  
✅ **Admin-Only Access**: Only authorized users can access dashboard  

## Login Credentials:

You'll use the email and password you set up in the Clerk Dashboard to log into your admin panel.

## Security Notes:

- Never share your admin credentials
- Use a strong password
- The User IDs in your `.env` file control who has admin access
- All authentication is handled securely by Clerk 