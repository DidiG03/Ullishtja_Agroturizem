/**
 * Google Ads Service
 * Handles Google Ads conversion tracking events
 */

class GoogleAdsService {
  /**
   * Track 'Get Directions' conversion event
   * This tracks when users click on the directions link to Google Maps
   */
  trackGetDirectionsConversion() {
    if (typeof window !== 'undefined' && window.gtag) {
      try {
        // Event snippet for Get directions conversion page
        window.gtag('event', 'conversion', {
          'send_to': 'AW-1742877024/SWLiCO6_u4EbBODctPIA'
        });
        console.log('Google Ads: Get Directions conversion tracked');
      } catch (error) {
        console.error('Error tracking Google Ads conversion:', error);
      }
    } else {
      console.warn('Google Ads gtag not available');
    }
  }

  /**
   * Generic conversion tracking method
   * @param {string} conversionId - The conversion ID from Google Ads
   * @param {Object} params - Additional parameters for the conversion
   */
  trackConversion(conversionId, params = {}) {
    if (typeof window !== 'undefined' && window.gtag) {
      try {
        window.gtag('event', 'conversion', {
          'send_to': conversionId,
          ...params
        });
        console.log(`Google Ads: Conversion tracked for ${conversionId}`);
      } catch (error) {
        console.error('Error tracking Google Ads conversion:', error);
      }
    } else {
      console.warn('Google Ads gtag not available');
    }
  }

  /**
   * Track phone click conversion
   * For when users click on phone number links
   */
  trackPhoneClickConversion() {
    if (typeof window !== 'undefined' && window.gtag) {
      try {
        // You can add another conversion ID here if you set up phone tracking
        window.gtag('event', 'conversion', {
          'send_to': 'AW-1742877024/phone_click' // Replace with actual phone conversion ID
        });
        console.log('Google Ads: Phone click conversion tracked');
      } catch (error) {
        console.error('Error tracking phone click conversion:', error);
      }
    }
  }

  /**
   * Track contact form submission conversion
   * For when users submit contact or reservation forms
   */
  trackContactFormConversion() {
    if (typeof window !== 'undefined' && window.gtag) {
      try {
        // You can add another conversion ID here if you set up form tracking
        window.gtag('event', 'conversion', {
          'send_to': 'AW-1742877024/form_submit' // Replace with actual form conversion ID
        });
        console.log('Google Ads: Contact form conversion tracked');
      } catch (error) {
        console.error('Error tracking contact form conversion:', error);
      }
    }
  }
}

// Create and export a singleton instance
const googleAdsService = new GoogleAdsService();
export default googleAdsService;