# Environment Variables Setup for Ullishtja Agroturizem

This guide explains how to set up the environment variables needed for the Ullishtja Agroturizem website.

## Required Environment Variables

Create a `.env` file in the root directory of your project with the following variables:

### Google Analytics 4 Setup

To enable website analytics, you need to set up Google Analytics 4:

1. **Create a Google Analytics 4 Property:**
   - Go to [Google Analytics](https://analytics.google.com/)
   - Create a new GA4 property for "Ullishtja Agroturizem"
   - Get your Measurement ID (format: G-XXXXXXXXXX)

2. **Add to your .env file:**
   ```bash
   # Google Analytics 4 Tracking ID
   REACT_APP_GA_TRACKING_ID=G-XXXXXXXXXX
   ```

### Complete .env Template

```bash
# Ullishtja Agroturizem Environment Variables

# Clerk Authentication (Required for admin features)
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here
REACT_APP_ADMIN_USER_IDS=user_id_1,user_id_2

# API Configuration
REACT_APP_API_URL=http://localhost:3001

# Google Analytics 4 (Optional - for website analytics)
# Get your GA4 tracking ID from Google Analytics 4 property
# Format: G-XXXXXXXXXX
REACT_APP_GA_TRACKING_ID=G-XXXXXXXXXX

# Database (Server-side)
DATABASE_URL=postgresql://username:password@localhost:5432/ullishtja_db

# Email Configuration (Server-side)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
RESTAURANT_EMAIL=ullishtja@example.com

# Environment
NODE_ENV=development
```

## Google Analytics Features

Once set up, the website will automatically track:

### Page Analytics
- **Page views** - Automatic tracking for all routes
- **Time on page** - How long users spend on each page
- **Scroll depth** - How far users scroll (25%, 50%, 75%, 90%, 100%)
- **Language preferences** - Track which language users prefer

### Restaurant-Specific Events
- **Menu views** - When users open the full menu
- **PDF downloads** - Menu PDF generation and downloads
- **Reservation attempts** - Form submissions
- **Reservation success** - Successful bookings
- **Menu category views** - Which menu sections are most popular
- **Language changes** - When users switch languages

### Contact & Engagement
- **Contact interactions** - Phone/email clicks
- **Video interactions** - Hero video play/pause
- **Error tracking** - Technical issues for debugging

## Privacy & Compliance

The analytics implementation includes privacy-focused settings:
- **IP anonymization** enabled
- **Google signals** disabled
- **Ad personalization** disabled
- Compliant with GDPR requirements

## Verification

Once you've added the `REACT_APP_GA_TRACKING_ID`, restart your development server:

```bash
npm start
```

You can verify it's working by:
1. Opening browser developer tools (F12)
2. Checking the Console for "Google Analytics initialized for Ullishtja Agroturizem"
3. Visiting Google Analytics Real-Time reports to see live activity

## Production Deployment

For production (Vercel), add the environment variable through the Vercel dashboard:
1. Go to your project in Vercel
2. Settings → Environment Variables
3. Add `REACT_APP_GA_TRACKING_ID` with your GA4 tracking ID

The analytics will automatically work in production without any code changes.