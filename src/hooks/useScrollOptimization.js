import { useEffect, useRef, useCallback } from 'react';

const useScrollOptimization = () => {
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);
  const rafRef = useRef(null);

  // Throttled scroll handler
  const handleScroll = useCallback(() => {
    if (!isScrollingRef.current) {
      isScrollingRef.current = true;
      
      // Add CSS class to body during scroll for performance optimizations
      document.body.classList.add('is-scrolling');
    }

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Set new timeout to detect scroll end
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
      document.body.classList.remove('is-scrolling');
    }, 150); // 150ms after scroll ends
  }, []);

  // Optimized scroll listener using RAF
  const optimizedScrollHandler = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    
    rafRef.current = requestAnimationFrame(handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    // Add scroll listener with passive for better performance
    window.addEventListener('scroll', optimizedScrollHandler, { passive: true });
    
    // Add CSS optimizations during scroll
    const style = document.createElement('style');
    style.textContent = `
      .is-scrolling * {
        pointer-events: none !important;
      }
      
      .is-scrolling .optimized-video {
        image-rendering: optimizeSpeed;
        image-rendering: -webkit-optimize-contrast;
      }
      
      .is-scrolling .hero-main-image {
        animation-play-state: paused;
      }
    `;
    document.head.appendChild(style);

    return () => {
      window.removeEventListener('scroll', optimizedScrollHandler);
      document.head.removeChild(style);
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [optimizedScrollHandler]);

  return {
    isScrolling: isScrollingRef.current
  };
};

export default useScrollOptimization; 