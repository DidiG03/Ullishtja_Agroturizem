// Integrated Analytics Service - Combines Google Analytics & Vercel Analytics
import googleAnalyticsService from './googleAnalytics';
import vercelAnalyticsService from './vercelAnalytics';

class IntegratedAnalyticsService {
  constructor() {
    this.initialized = false;
  }

  // Initialize both analytics services
  initialize() {
    if (this.initialized) return;

    try {
      // Initialize Google Analytics
      googleAnalyticsService.initialize();
      
      // Initialize Vercel Analytics
      vercelAnalyticsService.initialize();

      this.initialized = true;

    } catch (error) {
      console.error('Failed to initialize integrated analytics:', error);
    }
  }

  // Track page views in both systems
  trackPageView(pagePath, pageTitle, language = 'al') {
    try {
      // Google Analytics
      googleAnalyticsService.trackPageView(pagePath, pageTitle, language);
      
      // Vercel Analytics (automatically tracks page views, but we can add custom properties)
      vercelAnalyticsService.trackEvent('page_view', {
        page_path: pagePath,
        page_title: pageTitle,
        language,
        restaurant_name: 'Ullishtja Agroturizem'
      });
    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  }

  // Track menu interactions in both systems
  trackMenuView(language = 'al', menuType = 'full') {
    try {
      googleAnalyticsService.trackMenuView(language, menuType);
      vercelAnalyticsService.trackMenuInteraction('view', menuType, language);
    } catch (error) {
      console.error('Failed to track menu view:', error);
    }
  }

  trackMenuCategoryClick(category, language = 'al') {
    try {
      googleAnalyticsService.trackMenuCategoryClick(category, language);
      vercelAnalyticsService.trackMenuInteraction('category_click', category, language);
    } catch (error) {
      console.error('Failed to track menu category click:', error);
    }
  }

  trackMenuItemView(itemName, category, price, language = 'al') {
    try {
      googleAnalyticsService.trackMenuItemView(itemName, category, price, language);
      vercelAnalyticsService.trackEvent('menu_item_view', {
        item_name: itemName,
        category,
        price,
        language,
        restaurant_name: 'Ullishtja Agroturizem'
      });
    } catch (error) {
      console.error('Failed to track menu item view:', error);
    }
  }

  // Track reservations in both systems
  trackReservationAttempt(date, time, partySize, language = 'al') {
    try {
      googleAnalyticsService.trackReservationAttempt(date, time, partySize, language);
      vercelAnalyticsService.trackReservationEvent('attempt', {
        date,
        time,
        party_size: partySize,
        language
      });
    } catch (error) {
      console.error('Failed to track reservation attempt:', error);
    }
  }

  trackReservationSuccess(reservationId, date, time, partySize, language = 'al') {
    try {
      googleAnalyticsService.trackReservationSuccess(reservationId, date, time, partySize, language);
      vercelAnalyticsService.trackReservationEvent('success', {
        reservation_id: reservationId,
        date,
        time,
        party_size: partySize,
        language
      });
    } catch (error) {
      console.error('Failed to track reservation success:', error);
    }
  }

  trackReservationError(errorType, errorMessage, language = 'al') {
    try {
      googleAnalyticsService.trackReservationError(errorType, errorMessage, language);
      vercelAnalyticsService.trackReservationEvent('error', {
        error_type: errorType,
        error_message: errorMessage,
        language
      });
    } catch (error) {
      console.error('Failed to track reservation error:', error);
    }
  }

  // Track language changes in both systems
  trackLanguageChange(fromLanguage, toLanguage) {
    try {
      googleAnalyticsService.trackLanguageChange(fromLanguage, toLanguage);
      vercelAnalyticsService.trackLanguageChange(fromLanguage, toLanguage);
    } catch (error) {
      console.error('Failed to track language change:', error);
    }
  }

  // Track PDF downloads in both systems
  trackPDFDownload(menuType, language = 'al') {
    try {
      googleAnalyticsService.trackPDFDownload(menuType, language);
      vercelAnalyticsService.trackPDFDownload(menuType, language);
    } catch (error) {
      console.error('Failed to track PDF download:', error);
    }
  }

  // Track contact interactions in both systems
  trackWhatsAppClick(language = 'al') {
    try {
      googleAnalyticsService.trackWhatsAppClick(language);
      vercelAnalyticsService.trackContactInteraction('whatsapp');
    } catch (error) {
      console.error('Failed to track WhatsApp click:', error);
    }
  }

  trackPhoneClick(language = 'al') {
    try {
      googleAnalyticsService.trackPhoneClick(language);
      vercelAnalyticsService.trackContactInteraction('phone');
    } catch (error) {
      console.error('Failed to track phone click:', error);
    }
  }

  trackEmailClick(language = 'al') {
    try {
      googleAnalyticsService.trackEmailClick(language);
      vercelAnalyticsService.trackContactInteraction('email');
    } catch (error) {
      console.error('Failed to track email click:', error);
    }
  }

  // Track user engagement in both systems
  trackScrollDepth(depth, language = 'al') {
    try {
      googleAnalyticsService.trackScrollDepth(depth, language);
      vercelAnalyticsService.trackEvent('scroll_depth', {
        depth,
        language,
        restaurant_name: 'Ullishtja Agroturizem'
      });
    } catch (error) {
      console.error('Failed to track scroll depth:', error);
    }
  }

  trackTimeOnPage(seconds, pagePath, language = 'al') {
    try {
      googleAnalyticsService.trackTimeOnPage(seconds, pagePath, language);
      vercelAnalyticsService.trackEvent('time_on_page', {
        seconds,
        page_path: pagePath,
        language,
        restaurant_name: 'Ullishtja Agroturizem'
      });
    } catch (error) {
      console.error('Failed to track time on page:', error);
    }
  }

  // Track errors in both systems
  trackError(errorType, errorMessage, pagePath, language = 'al') {
    try {
      googleAnalyticsService.trackError(errorType, errorMessage, pagePath, language);
      vercelAnalyticsService.trackEvent('error', {
        error_type: errorType,
        error_message: errorMessage,
        page_path: pagePath,
        language,
        restaurant_name: 'Ullishtja Agroturizem'
      });
    } catch (error) {
      console.error('Failed to track error:', error);
    }
  }

  // Performance tracking (mainly handled by Vercel Speed Insights)
  trackPerformance(metric, value) {
    try {
      vercelAnalyticsService.trackPerformance(metric, value);
      
      // Also track in Google Analytics for comparison
      if (googleAnalyticsService.isEnabled && window.gtag) {
        window.gtag('event', 'performance_metric', {
          metric_name: metric,
          metric_value: value,
          restaurant_name: 'Ullishtja Agroturizem'
        });
      }
    } catch (error) {
      console.error('Failed to track performance:', error);
    }
  }

  // Utility methods
  isEnabled() {
    return googleAnalyticsService.isEnabled || vercelAnalyticsService.isAnalyticsEnabled();
  }

  isInitialized() {
    return this.initialized;
  }

  getActiveServices() {
    return {
      googleAnalytics: googleAnalyticsService.isEnabled,
      vercelAnalytics: vercelAnalyticsService.isAnalyticsEnabled(),
      vercelSpeedInsights: vercelAnalyticsService.isSpeedInsightsEnabled()
    };
  }
}

// Create singleton instance
const integratedAnalyticsService = new IntegratedAnalyticsService();

export default integratedAnalyticsService;