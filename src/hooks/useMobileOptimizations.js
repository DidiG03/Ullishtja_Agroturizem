import { useEffect, useCallback, useRef } from 'react';

const useMobileOptimizations = () => {
  const touchStartRef = useRef(null);
  const isScrollingRef = useRef(false);

  // Enhanced overscroll prevention with menu awareness
  const preventOverscroll = useCallback((e) => {
    const element = e.target;
    
    // If body is scroll-locked (menu is open), prevent all scrolling except within mobile nav
    if (document.body.classList.contains('scroll-locked')) {
      // Allow scrolling only within mobile nav
      if (element.closest('.mobile-nav')) {
        return;
      }
      // Block all other scrolling when menu is open
      e.preventDefault();
      return;
    }
    
    // Normal overscroll prevention for when menu is closed
    if (element === document.body || element === document.documentElement) {
      e.preventDefault();
    }
  }, []);

  // Optimize touch handling
  const handleTouchStart = useCallback((e) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now()
    };
    isScrollingRef.current = false;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!touchStartRef.current || isScrollingRef.current) return;

    const deltaX = Math.abs(e.touches[0].clientX - touchStartRef.current.x);
    const deltaY = Math.abs(e.touches[0].clientY - touchStartRef.current.y);
    const element = e.target;
    
    // If menu is open, only allow scrolling within mobile nav
    if (document.body.classList.contains('scroll-locked')) {
      if (!element.closest('.mobile-nav') && !element.closest('.mobile-menu-container')) {
        e.preventDefault();
        return;
      }
      
      // Allow horizontal scrolling in mobile categories navigation
      if (element.closest('.mobile-categories-nav')) {
        return; // Let the browser handle horizontal scrolling for categories
      }
      
      // Allow vertical scrolling within mobile menu content
      if (deltaY > deltaX && element.closest('.mobile-menu-content')) {
        return;
      }
    }
    
    // Determine scroll direction for normal operation
    if (deltaY > deltaX) {
      isScrollingRef.current = true;
    }

    // Prevent horizontal scroll on certain elements when menu is closed
    if (deltaX > deltaY && (deltaX > 10)) {
      if (!element.closest('.scroll-controlled-video-section') && 
          !element.closest('.gallery') &&
          !element.closest('.mobile-nav') &&
          !element.closest('.mobile-categories-nav')) {
        e.preventDefault();
      }
    }
  }, []);

  // Fix viewport height on mobile (address bar issue)
  const setMobileViewportHeight = useCallback(() => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }, []);

  // Optimize scrolling performance
  const optimizeScrolling = useCallback(() => {
    let ticking = false;
    
    const updateScrollState = () => {
      // Add scroll class for CSS optimizations
      document.body.classList.add('is-scrolling');
      
      clearTimeout(window.scrollTimeout);
      window.scrollTimeout = setTimeout(() => {
        document.body.classList.remove('is-scrolling');
      }, 150);
      
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollState);
        ticking = true;
      }
    };

    return onScroll;
  }, []);

  // Prevent zoom on form inputs
  const preventZoomOnInputs = useCallback(() => {
    const metaViewport = document.querySelector('meta[name=viewport]');
    if (metaViewport) {
      metaViewport.setAttribute('content', 
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0'
      );
    }
  }, []);

  // Optimize images for mobile
  const optimizeImages = useCallback(() => {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.loading) {
        img.loading = 'lazy';
      }
      if (!img.decoding) {
        img.decoding = 'async';
      }
    });
  }, []);

  // Preload critical resources
  const preloadCriticalResources = useCallback(() => {
    // Preload hero video poster
    const heroVideoPoster = new Image();
    heroVideoPoster.src = '/videos/dji-20240806130059-0020-d-poster.jpg';
    
    // Font preloading removed - not using georgia-bold font in the design
  }, []);

  // Initialize mobile optimizations - simplified to avoid memory leaks
  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) return;

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

    // Apply optimizations
    setVH();
    handleTouchOptimization();
    document.body.classList.add('mobile-device');

    // Add simplified event listeners
    window.addEventListener('resize', setVH, { passive: true });
    window.addEventListener('orientationchange', setVH, { passive: true });
    document.addEventListener('touchmove', handleOverscroll, { passive: false });

    // Cleanup
    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
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