import { useEffect, useRef, useCallback } from 'react';

const useScrollOptimization = () => {
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);
  const rafRef = useRef(null);

  // Throttled scroll handler
  const handleScroll = useCallback(() => {
    if (!isScrollingRef.current) {
      isScrollingRef.current = true;
    }
  }, []);

  // Optimized scroll listener using RAF
  const optimizedScrollHandler = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    
    rafRef.current = requestAnimationFrame(handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    // Simplified scroll handler to prevent memory leaks
    const handleScrollSimple = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      
      rafRef.current = requestAnimationFrame(() => {
        if (!isScrollingRef.current) {
          isScrollingRef.current = true;
          document.body.classList.add('is-scrolling');
        }

        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }

        scrollTimeoutRef.current = setTimeout(() => {
          isScrollingRef.current = false;
          document.body.classList.remove('is-scrolling');
        }, 150);
      });
    };

    // Add scroll listener with passive for better performance
    window.addEventListener('scroll', handleScrollSimple, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScrollSimple);
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      
      // Cleanup CSS class
      document.body.classList.remove('is-scrolling');
    };
  }, []); // Empty dependency array to prevent re-creation

  return {
    isScrolling: isScrollingRef.current
  };
};

export default useScrollOptimization; 