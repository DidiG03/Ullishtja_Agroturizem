// Google Ads Conversion Tracking Service for Ullishtja Agroturizem

class GoogleAdsService {
  constructor() {
    this.adsId = 'AW-17442877024';
    this.isEnabled = typeof window !== 'undefined' && typeof window.gtag === 'function';
    
    // Conversion IDs from Google Ads
    this.conversions = {
      getDirections: 'AW-17442877024/SWLiC06_u4EbODctP1A',
      reservation: 'AW-17442877024/RESERVATION_ID', // Replace with actual ID when created
      phoneCall: 'AW-17442877024/PHONE_ID', // Replace with actual ID when created
      contact: 'AW-17442877024/CONTACT_ID', // Replace with actual ID when created
      menuDownload: 'AW-17442877024/MENU_ID' // Replace with actual ID when created
    };
  }

  // Generic conversion tracking method
  trackConversion(conversionId, conversionValue = null, currency = 'EUR') {
    if (!this.isEnabled) {
      console.warn('Google Ads tracking not available');
      return;
    }

    try {
      const conversionData = {
        send_to: conversionId
      };

      // Add value if provided (useful for reservation tracking)
      if (conversionValue) {
        conversionData.value = conversionValue;
        conversionData.currency = currency;
      }

      window.gtag('event', 'conversion', conversionData);
      
      console.info('Google Ads conversion tracked:', conversionId);
    } catch (error) {
      console.error('Error tracking Google Ads conversion:', error);
    }
  }

  // Specific conversion tracking methods
  
  // Track when someone makes a reservation (high value conversion)
  trackReservation(guestCount = null, estimatedValue = null) {
    // Estimate value based on average spend per person (adjust as needed)
    const avgSpendPerPerson = 25; // EUR
    const value = estimatedValue || (guestCount ? guestCount * avgSpendPerPerson : 50);
    
    this.trackConversion(this.conversions.reservation, value);
    
    // Also track as a custom event for additional insights
    if (this.isEnabled) {
      window.gtag('event', 'reservation_made', {
        event_category: 'Restaurant',
        event_label: 'Table Reservation',
        value: value,
        guests: guestCount
      });
    }
  }

  // Track when someone requests directions (good intent signal)
  trackGetDirections() {
    this.trackConversion(this.conversions.getDirections);
    
    if (this.isEnabled) {
      window.gtag('event', 'get_directions', {
        event_category: 'Navigation',
        event_label: 'Directions Requested'
      });
    }
  }

  // Track phone calls (high intent)
  trackPhoneCall() {
    this.trackConversion(this.conversions.phoneCall);
    
    if (this.isEnabled) {
      window.gtag('event', 'phone_call', {
        event_category: 'Contact',
        event_label: 'Phone Call Initiated'
      });
    }
  }

  // Track contact form submissions
  trackContactForm(formType = 'general') {
    this.trackConversion(this.conversions.contact);
    
    if (this.isEnabled) {
      window.gtag('event', 'contact_form', {
        event_category: 'Contact',
        event_label: `Contact Form - ${formType}`
      });
    }
  }

  // Track menu downloads
  trackMenuDownload(menuType = 'complete') {
    this.trackConversion(this.conversions.menuDownload);
    
    if (this.isEnabled) {
      window.gtag('event', 'menu_download', {
        event_category: 'Engagement',
        event_label: `Menu Download - ${menuType}`
      });
    }
  }

  // Track high engagement actions
  trackEngagement(action, category = 'Engagement') {
    if (!this.isEnabled) return;

    window.gtag('event', action, {
      event_category: category,
      event_label: action
    });
  }

  // Track page views with enhanced data
  trackPageView(pageName, pageCategory = 'Website') {
    if (!this.isEnabled) return;

    window.gtag('event', 'page_view', {
      page_title: pageName,
      page_category: pageCategory
    });
  }

  // Helper method to check if Google Ads is loaded
  isGoogleAdsLoaded() {
    return this.isEnabled;
  }

  // Initialize enhanced tracking (call this on app start)
  initialize() {
    if (!this.isEnabled) {
      console.warn('Google Ads not available - make sure gtag is loaded');
      return;
    }

    // Track initial page load
    this.trackPageView('Home Page', 'Landing');
    
    console.info('Google Ads conversion tracking initialized');
  }
}

// Export singleton instance
const googleAdsService = new GoogleAdsService();
export default googleAdsService;