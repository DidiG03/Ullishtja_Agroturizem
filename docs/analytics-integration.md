# Analytics Integration Guide - Ullishtja Agroturizem

## Overview

This project uses an integrated analytics setup combining **Google Analytics 4** and **Vercel Analytics** with **Vercel Speed Insights** to provide comprehensive tracking and performance monitoring.

## Analytics Services

### 1. Google Analytics 4
- **Purpose**: Detailed user behavior tracking, conversion tracking, and audience insights
- **Configuration**: `src/services/googleAnalytics.js`
- **Environment Variable**: `REACT_APP_GA_TRACKING_ID`

### 2. Vercel Analytics
- **Purpose**: Lightweight, privacy-focused analytics with automatic Core Web Vitals tracking
- **Configuration**: `src/services/vercelAnalytics.js`
- **Auto-enabled**: Works automatically in production on Vercel platform

### 3. Vercel Speed Insights
- **Purpose**: Real User Monitoring (RUM) for Core Web Vitals and performance metrics
- **Auto-enabled**: Works automatically in production on Vercel platform

## Integration Architecture

### Main Services
```
IntegratedAnalyticsService
├── GoogleAnalyticsService (detailed tracking)
├── VercelAnalyticsService (performance + events)
└── Combined tracking methods
```

### Files Structure
```
src/
├── services/
│   ├── googleAnalytics.js       # Google Analytics 4 implementation
│   ├── vercelAnalytics.js       # Vercel Analytics + Speed Insights
│   └── integratedAnalytics.js   # Combined service
├── hooks/
│   └── useGoogleAnalytics.js    # React hook for analytics
└── components/
    └── AnalyticsTest.js         # Development testing component
```

## Environment Variables

Add these to your `.env` file:

```bash
# Google Analytics (Optional)
REACT_APP_GA_TRACKING_ID=G-XXXXXXXXXX

# Vercel Analytics Debug Mode (Development only)
REACT_APP_VERCEL_ANALYTICS_DEBUG=false
REACT_APP_VERCEL_SPEED_INSIGHTS_DEBUG=false
```

## Usage Examples

### Basic Hook Usage
```javascript
import { useGoogleAnalytics, useAnalyticsTracking } from './hooks/useGoogleAnalytics';

function MyComponent() {
  // Auto-initializes and tracks page views
  useGoogleAnalytics();
  
  // Get tracking methods
  const analytics = useAnalyticsTracking();
  
  const handleMenuClick = () => {
    analytics.trackMenuCategory('Sallata', 'al');
  };
}
```

### Direct Service Usage
```javascript
import integratedAnalyticsService from './services/integratedAnalytics';

// Track custom events
integratedAnalyticsService.trackMenuView('al', 'full');
integratedAnalyticsService.trackReservationAttempt('2024-01-15', '19:00', 4, 'en');
integratedAnalyticsService.trackPDFDownload('full_menu', 'al');
```

## Tracked Events

### Restaurant-Specific Events
- **Menu Interactions**: View, category clicks, item views
- **Reservations**: Attempts, successes, errors
- **Contact**: WhatsApp, phone, email clicks
- **Downloads**: PDF menu downloads
- **Language**: Language changes
- **Performance**: Page load times, Core Web Vitals

### Automatic Tracking
- **Page Views**: All route changes
- **Scroll Depth**: 25%, 50%, 75%, 90%, 100%
- **Time on Page**: Session duration tracking
- **Errors**: JavaScript errors and API failures
- **Core Web Vitals**: LCP, FID, CLS (via Speed Insights)

## Development Testing

### Analytics Test Component
In development mode, a test widget appears in the bottom-right corner showing:
- ✅ Analytics initialization status
- ✅ Active services (GA, Vercel Analytics, Speed Insights)
- 🧪 Test button to fire sample events

### Debug Console
All analytics events are logged to browser console in development:
```javascript
console.log('Active analytics services:', {
  googleAnalytics: true,
  vercelAnalytics: true,
  vercelSpeedInsights: true
});
```

## Production Deployment

### Vercel Platform
1. **Automatic**: Vercel Analytics and Speed Insights work automatically
2. **No configuration needed**: Just deploy to Vercel
3. **Dashboard access**: View analytics in Vercel dashboard

### Google Analytics Setup
1. Create GA4 property
2. Add tracking ID to environment variables
3. Verify tracking in GA4 Real-Time reports

### Environment Variables for Production
```bash
NODE_ENV=production
REACT_APP_GA_TRACKING_ID=G-XXXXXXXXXX
# Vercel analytics work automatically - no env vars needed
```

## Privacy & Compliance

### Google Analytics
- **IP Anonymization**: Enabled by default
- **Google Signals**: Disabled
- **Ad Personalization**: Disabled
- **GDPR**: Respects user consent (implement consent banner if needed)

### Vercel Analytics
- **Privacy-first**: No personal data collection
- **GDPR Compliant**: No cookies used
- **Anonymous**: All data is anonymized

## Monitoring & Debugging

### Check Analytics Status
```javascript
// Check if analytics are working
console.log('Analytics enabled:', integratedAnalyticsService.isEnabled());
console.log('Services status:', integratedAnalyticsService.getActiveServices());
```

### Vercel Dashboard
- Visit [Vercel Dashboard](https://vercel.com/dashboard)
- Go to your project → Analytics tab
- View real-time performance metrics

### Google Analytics
- Visit [Google Analytics](https://analytics.google.com)
- Check Real-Time reports for live data
- View Behavior and Conversion reports

## Performance Impact

### Bundle Size
- **Vercel Analytics**: ~2KB gzipped
- **Google Analytics**: ~28KB gzipped (loaded asynchronously)
- **Total Impact**: Minimal, all scripts load non-blocking

### Loading Strategy
- **Async Loading**: All analytics scripts load asynchronously
- **Error Handling**: Graceful fallback if scripts fail to load
- **Development**: Debug mode available without affecting performance

## Troubleshooting

### Common Issues

1. **Analytics Not Loading**
   ```javascript
   // Check environment variables
   console.log('GA ID:', process.env.REACT_APP_GA_TRACKING_ID);
   ```

2. **Events Not Tracking**
   ```javascript
   // Verify initialization
   console.log('Initialized:', integratedAnalyticsService.isInitialized());
   ```

3. **Vercel Analytics Missing**
   - Ensure deployed on Vercel platform
   - Check project settings in Vercel dashboard

### Support
- **Google Analytics**: [GA4 Documentation](https://developers.google.com/analytics/devguides/collection/ga4)
- **Vercel Analytics**: [Vercel Analytics Docs](https://vercel.com/docs/analytics)
- **Speed Insights**: [Vercel Speed Insights Docs](https://vercel.com/docs/speed-insights)

---

## Quick Start Checklist

- [ ] Add `REACT_APP_GA_TRACKING_ID` to environment variables
- [ ] Deploy to Vercel for automatic Vercel Analytics
- [ ] Test with development widget
- [ ] Verify tracking in both GA4 and Vercel dashboards
- [ ] Monitor Core Web Vitals in Speed Insights

**🎉 Your integrated analytics setup is complete!**