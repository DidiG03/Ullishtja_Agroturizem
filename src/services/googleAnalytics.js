// Google Analytics 4 Service for Ullishtja Agroturizem
class GoogleAnalyticsService {
  constructor() {
    this.trackingId = process.env.REACT_APP_GA_TRACKING_ID;
    this.isEnabled = !!this.trackingId;
    this.initialized = false;
  }

  // Initialize Google Analytics
  initialize() {
    if (!this.isEnabled || this.initialized) return;

    try {
      // Load gtag script
      const gtagScript = document.createElement('script');
      gtagScript.async = true;
      gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${this.trackingId}`;
      document.head.appendChild(gtagScript);

      // Initialize gtag
      window.dataLayer = window.dataLayer || [];
      window.gtag = function() {
        window.dataLayer.push(arguments);
      };

      window.gtag('js', new Date());
      window.gtag('config', this.trackingId, {
        // Enhanced e-commerce and restaurant-specific settings
        page_title: 'Ullishtja Agroturizem',
        custom_map: {
          'custom_definition_1': 'language',
          'custom_definition_2': 'menu_category',
          'custom_definition_3': 'reservation_status'
        },
        // Privacy settings
        anonymize_ip: true,
        allow_google_signals: false,
        allow_ad_personalization_signals: false
      });

      this.initialized = true;
      console.log('Google Analytics initialized for Ullishtja Agroturizem');
    } catch (error) {
      console.error('Failed to initialize Google Analytics:', error);
    }
  }

  // Track page views
  trackPageView(pagePath, pageTitle, language = 'al') {
    if (!this.isEnabled || !window.gtag) return;

    try {
      window.gtag('config', this.trackingId, {
        page_path: pagePath,
        page_title: pageTitle,
        custom_definition_1: language
      });

      // Custom event for restaurant pages
      window.gtag('event', 'page_view', {
        page_title: pageTitle,
        page_location: window.location.href,
        page_path: pagePath,
        language: language,
        restaurant_name: 'Ullishtja Agroturizem'
      });
    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  }

  // Track menu interactions
  trackMenuView(language = 'al', menuType = 'full') {
    if (!this.isEnabled || !window.gtag) return;

    try {
      window.gtag('event', 'menu_view', {
        event_category: 'Menu',
        event_label: `${menuType}_menu_${language}`,
        language: language,
        menu_type: menuType,
        restaurant_section: 'menu'
      });
    } catch (error) {
      console.error('Failed to track menu view:', error);
    }
  }

  // Track PDF downloads
  trackPDFDownload(language = 'al', menuItemsCount = 0) {
    if (!this.isEnabled || !window.gtag) return;

    try {
      window.gtag('event', 'pdf_download', {
        event_category: 'Engagement',
        event_label: `menu_pdf_${language}`,
        value: 1,
        language: language,
        menu_items_count: menuItemsCount,
        file_type: 'pdf',
        download_type: 'menu'
      });
    } catch (error) {
      console.error('Failed to track PDF download:', error);
    }
  }

  // Track reservation attempts
  trackReservationAttempt(data = {}) {
    if (!this.isEnabled || !window.gtag) return;

    try {
      window.gtag('event', 'reservation_attempt', {
        event_category: 'Reservations',
        event_label: 'reservation_form_submit',
        value: 1,
        guests: data.guests || 0,
        date: data.date || '',
        time: data.time || '',
        language: data.language || 'al'
      });
    } catch (error) {
      console.error('Failed to track reservation attempt:', error);
    }
  }

  // Track successful reservations
  trackReservationSuccess(data = {}) {
    if (!this.isEnabled || !window.gtag) return;

    try {
      window.gtag('event', 'reservation_success', {
        event_category: 'Conversions',
        event_label: 'successful_reservation',
        value: 5, // Higher value for successful conversions
        guests: data.guests || 0,
        date: data.date || '',
        time: data.time || '',
        language: data.language || 'al',
        reservation_id: data.id || ''
      });

      // Also track as a conversion
      window.gtag('event', 'conversion', {
        send_to: this.trackingId,
        value: 1,
        currency: 'EUR',
        transaction_id: data.id || Date.now().toString()
      });
    } catch (error) {
      console.error('Failed to track reservation success:', error);
    }
  }

  // Track language changes
  trackLanguageChange(newLanguage, previousLanguage) {
    if (!this.isEnabled || !window.gtag) return;

    try {
      window.gtag('event', 'language_change', {
        event_category: 'User Interaction',
        event_label: `${previousLanguage}_to_${newLanguage}`,
        previous_language: previousLanguage,
        new_language: newLanguage
      });
    } catch (error) {
      console.error('Failed to track language change:', error);
    }
  }

  // Track menu category interactions
  trackMenuCategoryView(categoryName, language = 'al') {
    if (!this.isEnabled || !window.gtag) return;

    try {
      window.gtag('event', 'menu_category_view', {
        event_category: 'Menu',
        event_label: `category_${categoryName}_${language}`,
        custom_definition_2: categoryName,
        language: language,
        category_name: categoryName
      });
    } catch (error) {
      console.error('Failed to track menu category view:', error);
    }
  }

  // Track contact interactions
  trackContactInteraction(type, method = '') {
    if (!this.isEnabled || !window.gtag) return;

    try {
      window.gtag('event', 'contact_interaction', {
        event_category: 'Contact',
        event_label: `${type}_${method}`,
        contact_type: type,
        contact_method: method
      });
    } catch (error) {
      console.error('Failed to track contact interaction:', error);
    }
  }

  // Track video interactions
  trackVideoInteraction(action, videoId = 'hero_video') {
    if (!this.isEnabled || !window.gtag) return;

    try {
      window.gtag('event', 'video_interaction', {
        event_category: 'Media',
        event_label: `${action}_${videoId}`,
        video_action: action,
        video_id: videoId
      });
    } catch (error) {
      console.error('Failed to track video interaction:', error);
    }
  }

  // Track search functionality (if implemented)
  trackSearch(searchTerm, language = 'al') {
    if (!this.isEnabled || !window.gtag) return;

    try {
      window.gtag('event', 'search', {
        search_term: searchTerm,
        language: language
      });
    } catch (error) {
      console.error('Failed to track search:', error);
    }
  }

  // Track scroll depth for engagement
  trackScrollDepth(percentage) {
    if (!this.isEnabled || !window.gtag) return;

    try {
      window.gtag('event', 'scroll', {
        event_category: 'Engagement',
        event_label: `${percentage}%`,
        value: percentage
      });
    } catch (error) {
      console.error('Failed to track scroll depth:', error);
    }
  }

  // Track time spent on page
  trackTimeOnPage(timeInSeconds, pageName) {
    if (!this.isEnabled || !window.gtag) return;

    try {
      window.gtag('event', 'time_on_page', {
        event_category: 'Engagement',
        event_label: pageName,
        value: Math.round(timeInSeconds),
        time_seconds: timeInSeconds
      });
    } catch (error) {
      console.error('Failed to track time on page:', error);
    }
  }

  // Track errors
  trackError(error, context = '') {
    if (!this.isEnabled || !window.gtag) return;

    try {
      window.gtag('event', 'exception', {
        description: `${context}: ${error.message || error}`,
        fatal: false
      });
    } catch (err) {
      console.error('Failed to track error:', err);
    }
  }

  // Track user preferences
  trackUserPreference(preference, value) {
    if (!this.isEnabled || !window.gtag) return;

    try {
      window.gtag('event', 'user_preference', {
        event_category: 'User Behavior',
        event_label: `${preference}_${value}`,
        preference_type: preference,
        preference_value: value
      });
    } catch (error) {
      console.error('Failed to track user preference:', error);
    }
  }

  // Custom event tracker for any additional needs
  trackCustomEvent(eventName, parameters = {}) {
    if (!this.isEnabled || !window.gtag) return;

    try {
      window.gtag('event', eventName, {
        event_category: 'Custom',
        ...parameters
      });
    } catch (error) {
      console.error('Failed to track custom event:', error);
    }
  }
}

// Create and export singleton instance
const googleAnalyticsService = new GoogleAnalyticsService();
export default googleAnalyticsService;