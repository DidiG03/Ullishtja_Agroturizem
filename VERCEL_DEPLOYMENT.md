# Vercel Deployment Guide for Ullishtja Agroturizem

## Pre-Deployment Checklist

### 1. Environment Variables Setup
You need to configure these environment variables in Vercel Dashboard:

#### Required Database Configuration
```
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
```

#### Required Clerk Authentication
```
CLERK_SECRET_KEY="sk_test_your_secret_key_here"
REACT_APP_CLERK_PUBLISHABLE_KEY="pk_test_your_publishable_key_here"
```

#### Required Admin Configuration
```
REACT_APP_ADMIN_USER_IDS="user_xxxxx,user_yyyyy"
```

#### Required API Configuration
```
REACT_APP_API_URL="https://your-vercel-app.vercel.app"
```

#### Optional Google Reviews (Already configured)
```
REACT_APP_GOOGLE_PLACES_API_KEY="AIzaSyBVqtCAyNk4YFM_rn3tOII_uJ8-a5WgCHY"
REACT_APP_GOOGLE_PLACE_ID="ChIJ_6oztHnbTxMRmn95pUlRg40"
REACT_APP_USE_REAL_REVIEWS="true"
```

#### System Configuration (Already in vercel.json)
```
NODE_ENV="production"
PRISMA_CLI_QUERY_ENGINE_TYPE="binary"
PRISMA_CLI_BINARY_TARGETS="rhel-openssl-1.0.x"
```

## Deployment Steps

### 1. Database Setup
1. Set up a PostgreSQL database (recommend Neon, Supabase, or PlanetScale)
2. Copy the DATABASE_URL and add it to Vercel environment variables

### 2. Clerk Authentication Setup
1. Create a Clerk account at https://clerk.dev
2. Create a new application
3. Copy the CLERK_SECRET_KEY and REACT_APP_CLERK_PUBLISHABLE_KEY
4. Add admin user IDs to REACT_APP_ADMIN_USER_IDS

### 3. Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Set all environment variables in Vercel Dashboard
3. Deploy the application
4. Update REACT_APP_API_URL with your Vercel deployment URL

### 4. Database Migration
After first deployment, run database migration:
```bash
npx prisma db push
```

### 5. Seed Data (Optional)
If you want to add initial menu data:
```bash
npm run seed-menu
```

## What's Fixed

✅ All API functions now use proper ES module syntax  
✅ Vercel configuration optimized for React + Serverless functions  
✅ Prisma configuration added for production deployment  
✅ CORS headers configured for API endpoints  
✅ Static asset routing configured  
✅ Build command includes Prisma generation  

## API Endpoints Available

- `/api/health` - Health check
- `/api/google-reviews` - Google Reviews integration
- `/api/reservations` - Reservation management
- `/api/reservations/[id]` - Individual reservation operations
- `/api/menu/categories` - Menu category management
- `/api/menu/categories/[id]` - Individual category operations
- `/api/menu/categories/reorder` - Category reordering
- `/api/menu/items` - Menu item management
- `/api/menu/items/[id]` - Individual item operations
- `/api/menu/items/reorder` - Item reordering
- `/api/menu/complete` - Complete menu fetch

## Troubleshooting

### If deployment still fails:
1. Check all environment variables are set correctly
2. Ensure DATABASE_URL is accessible from Vercel
3. Verify Clerk keys are for the correct environment
4. Check Vercel function logs for detailed error messages

### Database Connection Issues:
- Ensure database allows connections from Vercel IPs
- Check if DATABASE_URL includes SSL parameters
- Verify database is accessible from external connections

### API Issues:
- Check function logs in Vercel dashboard
- Verify CORS configuration
- Ensure all imports use ES module syntax 