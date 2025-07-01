# Clerk Authentication Setup

## 1. Get Clerk Credentials

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Create an account or sign in
3. Create a new application
4. Copy your **Publishable Key** from the API Keys page

## 2. Environment Variables

Create a `.env` file in the root of your project and add:

```
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
REACT_APP_ADMIN_USER_IDS=user_your_admin_user_id_here
```

**Important Notes:**
- Replace `pk_test_your_publishable_key_here` with your actual Clerk publishable key
- Replace `user_your_admin_user_id_here` with your actual Clerk user ID (you'll get this after creating your first admin user)
- For multiple admins, separate user IDs with commas: `user_id1,user_id2,user_id3`

## 3. Getting Your Admin User ID

1. Start the application: `npm start`
2. Go to `/admin-login` and sign up/sign in with your admin account
3. In the browser console, you can run: `console.log(window.clerk.user.id)` to see your user ID
4. Add this ID to your `.env` file under `REACT_APP_ADMIN_USER_IDS`

## 4. Available Routes

- `/` - Main website
- `/admin-login` - Admin login page
- `/dashboard` - Protected admin dashboard (requires authentication and admin permissions)

## 5. Security Features

- ✅ Route protection middleware
- ✅ Admin role verification
- ✅ Secure authentication with Clerk
- ✅ Automatic redirect after login
- ✅ Session management
- ✅ Access control for dashboard

## 6. Customization

You can customize the admin login page and dashboard by modifying:
- `src/components/AdminLogin.js` - Login page component
- `src/components/AdminLogin.css` - Login page styles
- `src/components/Dashboard.js` - Dashboard component
- `src/components/Dashboard.css` - Dashboard styles

## 7. Troubleshooting

If you encounter issues:
1. Make sure your `.env` file is in the root directory
2. Restart the development server after adding environment variables
3. Check that your Clerk publishable key is correct
4. Verify your admin user ID is correctly added to the environment variables 