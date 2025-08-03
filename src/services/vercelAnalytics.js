// Vercel Analytics & Speed Insights Service for Ullishtja Agroturizem
import { inject } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';

class VercelAnalyticsService {
  constructor() {
    this.analyticsEnabled = process.env.NODE_ENV === 'production' || process.env.REACT_APP_VERCEL_ANALYTICS_DEBUG === 'true';
    this.speedInsightsEnabled = process.env.NODE_ENV === 'production' || process.env.REACT_APP_VERCEL_SPEED_INSIGHTS_DEBUG === 'true';
    this.initialized = false;
  }

  // Initialize Vercel Analytics and Speed Insights
  initialize() {
    if (this.initialized) return;

    try {
      // Initialize Vercel Analytics
      if (this.analyticsEnabled) {
        inject({
          mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
          debug: process.env.REACT_APP_VERCEL_ANALYTICS_DEBUG === 'true'
        });
        console.log('Vercel Analytics initialized');
      }

      // Initialize Speed Insights
      if (this.speedInsightsEnabled) {
        injectSpeedInsights({
          framework: 'react',
          debug: process.env.REACT_APP_VERCEL_SPEED_INSIGHTS_DEBUG === 'true'
        });
        console.log('Vercel Speed Insights initialized');
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize Vercel Analytics:', error);
    }
  }

  // Track custom events (works alongside Google Analytics)
  trackEvent(eventName, properties = {}) {
    if (!this.analyticsEnabled || typeof window === 'undefined') return;

    try {
      // Vercel Analytics automatically captures events when using inject()
      // For custom events, we can use the va function if available
      if (window.va) {
        window.va('track', eventName, properties);
      }
    } catch (error) {
      console.error('Failed to track Vercel event:', error);
    }
  }

  // Track restaurant-specific events
  trackMenuInteraction(action, menuCategory, language = 'al') {
    this.trackEvent('menu_interaction', {
      action,
      menu_category: menuCategory,
      language,
      restaurant_name: 'Ullishtja Agroturizem'
    });
  }

  trackReservationEvent(action, details = {}) {
    this.trackEvent('reservation_event', {
      action,
      ...details,
      restaurant_name: 'Ullishtja Agroturizem'
    });
  }

  trackLanguageChange(from, to) {
    this.trackEvent('language_change', {
      from_language: from,
      to_language: to,
      restaurant_name: 'Ullishtja Agroturizem'
    });
  }

  trackPDFDownload(menuType, language) {
    this.trackEvent('pdf_download', {
      menu_type: menuType,
      language,
      restaurant_name: 'Ullishtja Agroturizem'
    });
  }

  trackContactInteraction(method) {
    this.trackEvent('contact_interaction', {
      method, // 'whatsapp', 'phone', 'email'
      restaurant_name: 'Ullishtja Agroturizem'
    });
  }

  // Performance tracking (automatically handled by Speed Insights)
  trackPerformance(metric, value) {
    if (!this.speedInsightsEnabled) return;
    
    try {
      // Speed Insights automatically tracks Core Web Vitals
      // This method is for any additional custom performance metrics
      console.log(`Performance metric ${metric}:`, value);
    } catch (error) {
      console.error('Failed to track performance metric:', error);
    }
  }

  // Check if services are enabled
  isAnalyticsEnabled() {
    return this.analyticsEnabled;
  }

  isSpeedInsightsEnabled() {
    return this.speedInsightsEnabled;
  }

  isInitialized() {
    return this.initialized;
  }
}

// Create singleton instance
const vercelAnalyticsService = new VercelAnalyticsService();

export default vercelAnalyticsService;