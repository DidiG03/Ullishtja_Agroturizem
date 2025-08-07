import { useEffect, useCallback, useRef } from 'react';

const useMobileOptimizations = () => {

  // Initialize mobile optimizations - handles resize events properly
  useEffect(() => {
    // Check mobile status
    const checkMobileStatus = () => {
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        document.body.classList.add('mobile-device');
      } else {
        document.body.classList.remove('mobile-device');
      }
      return isMobile;
    };

    // Set up viewport height - simplified version
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    // Simple overscroll prevention
    const handleOverscroll = (e) => {
      if (e.target === document.body) {
        e.preventDefault();
      }
    };

    // Simple touch optimization
    const handleTouchOptimization = () => {
      document.body.style.setProperty('-webkit-overflow-scrolling', 'touch');
      document.body.style.setProperty('overscroll-behavior', 'none');
    };

    // Handle resize events
    const handleResize = () => {
      const isMobile = checkMobileStatus();
      setVH();
      if (isMobile) {
        handleTouchOptimization();
      }
    };

    // Initial setup
    const isMobile = checkMobileStatus();
    setVH();
    if (isMobile) {
      handleTouchOptimization();
    }

    // Add event listeners
    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });
    if (isMobile) {
      document.addEventListener('touchmove', handleOverscroll, { passive: false });
    }

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      document.removeEventListener('touchmove', handleOverscroll);
      document.body.classList.remove('mobile-device');
    };
  }, []); // Empty dependency array - no re-creation

  // Enhanced scroll prevention with position preservation
  const scrollPositionRef = useRef(0);

  const preventBodyScroll = useCallback(() => {
    // Store current scroll position
    scrollPositionRef.current = window.pageYOffset || document.documentElement.scrollTop;
    
    // Apply comprehensive scroll prevention
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollPositionRef.current}px`;
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    
    // Add CSS class for additional prevention
    document.body.classList.add('scroll-locked');
    document.documentElement.classList.add('scroll-locked');
    
    // iOS specific prevention
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      document.body.style.webkitOverflowScrolling = 'touch';
      document.body.style.touchAction = 'none';
    }
  }, []);

  const enableBodyScroll = useCallback(() => {
    // Remove styles and classes
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.height = '';
    document.body.style.webkitOverflowScrolling = '';
    document.body.style.touchAction = '';
    
    document.body.classList.remove('scroll-locked');
    document.documentElement.classList.remove('scroll-locked');
    
    // Restore scroll position
    if (scrollPositionRef.current > 0) {
      window.scrollTo(0, scrollPositionRef.current);
      scrollPositionRef.current = 0;
    }
  }, []);

  // Return utility functions for components to use
  return {
    isMobile: window.innerWidth <= 768,
    isTouch: 'ontouchstart' in window,
    preventBodyScroll,
    enableBodyScroll
  };
};

export default useMobileOptimizations; 