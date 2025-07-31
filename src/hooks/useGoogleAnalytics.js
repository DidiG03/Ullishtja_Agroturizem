import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import googleAnalyticsService from '../services/googleAnalytics';

// Hook for Google Analytics integration
export const useGoogleAnalytics = () => {
  const location = useLocation();
  const previousLocation = useRef(location);
  const pageStartTime = useRef(Date.now());

  // Initialize GA on mount
  useEffect(() => {
    googleAnalyticsService.initialize();
  }, []);

  // Track page views on route changes
  useEffect(() => {
    const currentPath = location.pathname + location.search;
    const previousPath = previousLocation.current.pathname + previousLocation.current.search;

    // Track time on previous page
    if (previousPath !== currentPath) {
      const timeOnPage = (Date.now() - pageStartTime.current) / 1000;
      if (timeOnPage > 1) { // Only track if user spent more than 1 second
        googleAnalyticsService.trackTimeOnPage(timeOnPage, previousPath);
      }
    }

    // Track new page view
    const pageTitle = getPageTitle(currentPath);
    googleAnalyticsService.trackPageView(currentPath, pageTitle);

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
            googleAnalyticsService.trackScrollDepth(threshold);
          }
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location]);

  return googleAnalyticsService;
};

// Hook specifically for tracking user interactions
export const useAnalyticsTracking = () => {
  return {
    trackMenuView: (language, menuType) => 
      googleAnalyticsService.trackMenuView(language, menuType),
    
    trackPDFDownload: (language, itemsCount) => 
      googleAnalyticsService.trackPDFDownload(language, itemsCount),
    
    trackReservationAttempt: (data) => 
      googleAnalyticsService.trackReservationAttempt(data),
    
    trackReservationSuccess: (data) => 
      googleAnalyticsService.trackReservationSuccess(data),
    
    trackLanguageChange: (newLang, prevLang) => 
      googleAnalyticsService.trackLanguageChange(newLang, prevLang),
    
    trackMenuCategory: (category, language) => 
      googleAnalyticsService.trackMenuCategoryView(category, language),
    
    trackContact: (type, method) => 
      googleAnalyticsService.trackContactInteraction(type, method),
    
    trackVideo: (action, videoId) => 
      googleAnalyticsService.trackVideoInteraction(action, videoId),
    
    trackSearch: (term, language) => 
      googleAnalyticsService.trackSearch(term, language),
    
    trackError: (error, context) => 
      googleAnalyticsService.trackError(error, context),
    
    trackCustomEvent: (name, params) => 
      googleAnalyticsService.trackCustomEvent(name, params)
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