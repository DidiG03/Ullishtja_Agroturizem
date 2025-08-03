import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import integratedAnalyticsService from '../services/integratedAnalytics';

// Hook for Integrated Analytics (Google Analytics + Vercel Analytics)
export const useGoogleAnalytics = () => {
  const location = useLocation();
  const previousLocation = useRef(location);
  const pageStartTime = useRef(Date.now());

  // Initialize integrated analytics on mount
  useEffect(() => {
    integratedAnalyticsService.initialize();
    
    // Log which services are active
    const activeServices = integratedAnalyticsService.getActiveServices();
    console.log('Active analytics services:', activeServices);
  }, []);

  // Track page views on route changes
  useEffect(() => {
    const currentPath = location.pathname + location.search;
    const previousPath = previousLocation.current.pathname + previousLocation.current.search;

    // Track time on previous page
    if (previousPath !== currentPath) {
      const timeOnPage = (Date.now() - pageStartTime.current) / 1000;
      if (timeOnPage > 1) { // Only track if user spent more than 1 second
        integratedAnalyticsService.trackTimeOnPage(timeOnPage, previousPath);
      }
    }

    // Track new page view
    const pageTitle = getPageTitle(currentPath);
    integratedAnalyticsService.trackPageView(currentPath, pageTitle);

    // Update refs
    previousLocation.current = location;
    pageStartTime.current = Date.now();
  }, [location]);

  // Track scroll depth
  useEffect(() => {
    let maxScrollDepth = 0;
    const trackScrollThreshold = [25, 50, 75, 90, 100];
    const trackedDepths = new Set();

    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);

      if (scrollPercent > maxScrollDepth) {
        maxScrollDepth = scrollPercent;
        
        // Track milestone scroll depths
        trackScrollThreshold.forEach(threshold => {
          if (scrollPercent >= threshold && !trackedDepths.has(threshold)) {
            trackedDepths.add(threshold);
            integratedAnalyticsService.trackScrollDepth(threshold);
          }
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location]);

  return integratedAnalyticsService;
};

// Hook specifically for tracking user interactions
export const useAnalyticsTracking = () => {
  return {
    trackMenuView: (language, menuType) => 
      integratedAnalyticsService.trackMenuView(language, menuType),
    
    trackPDFDownload: (menuType, language) => 
      integratedAnalyticsService.trackPDFDownload(menuType, language),
    
    trackReservationAttempt: (date, time, partySize, language) => 
      integratedAnalyticsService.trackReservationAttempt(date, time, partySize, language),
    
    trackReservationSuccess: (reservationId, date, time, partySize, language) => 
      integratedAnalyticsService.trackReservationSuccess(reservationId, date, time, partySize, language),
    
    trackLanguageChange: (fromLanguage, toLanguage) => 
      integratedAnalyticsService.trackLanguageChange(fromLanguage, toLanguage),
    
    trackMenuCategory: (category, language) => 
      integratedAnalyticsService.trackMenuCategoryClick(category, language),
    
    trackWhatsAppClick: (language) => 
      integratedAnalyticsService.trackWhatsAppClick(language),
    
    trackPhoneClick: (language) => 
      integratedAnalyticsService.trackPhoneClick(language),
    
    trackEmailClick: (language) => 
      integratedAnalyticsService.trackEmailClick(language),
    
    trackError: (errorType, errorMessage, pagePath, language) => 
      integratedAnalyticsService.trackError(errorType, errorMessage, pagePath, language),
    
    trackMenuItemView: (itemName, category, price, language) => 
      integratedAnalyticsService.trackMenuItemView(itemName, category, price, language)
  };
};

// Helper function to generate page titles
function getPageTitle(path) {
  const titles = {
    '/': 'Home - Ullishtja Agroturizem',
    '/admin-login': 'Admin Login - Ullishtja Agroturizem',
    '/dashboard': 'Dashboard - Ullishtja Agroturizem'
  };

  return titles[path] || `${path} - Ullishtja Agroturizem`;
}

export default useGoogleAnalytics;