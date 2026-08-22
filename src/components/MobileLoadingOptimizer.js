import { useEffect } from 'react';

const MobileLoadingOptimizer = () => {
  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
      // Register video service worker for aggressive caching
      registerVideoServiceWorker();

      // Above-the-fold images are preloaded from index.html, where the browser can
      // act on them during HTML parsing. Doing it again here only competed with the
      // LCP image, and three of the four paths pointed at files that never existed —
      // which the SPA rewrite answered with index.html rather than a 404.

      // Scroll behaviour lives in App.css. Never set transform or
      // -webkit-overflow-scrolling on body: either one makes body the containing
      // block for position:fixed children, which drops the floating WhatsApp
      // button to the bottom of the page instead of pinning it to the viewport.

      // Set initial viewport height with enhanced mobile support
      const setVH = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        
        // Also set safe area insets for modern devices
        const safeAreaTop = getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top') || '0px';
        const safeAreaBottom = getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom') || '0px';
        
        document.documentElement.style.setProperty('--safe-top', safeAreaTop);
        document.documentElement.style.setProperty('--safe-bottom', safeAreaBottom);
      };
      
      setVH();
      
      // Enhanced event listeners with better performance
      const resizeHandler = throttle(setVH, 100);
      const orientationHandler = debounce(setVH, 150);
      
      window.addEventListener('resize', resizeHandler, { passive: true });
      window.addEventListener('orientationchange', orientationHandler, { passive: true });
      
      // Optimize video memory usage on low-power devices
      if (navigator.deviceMemory && navigator.deviceMemory <= 2) {
        document.documentElement.classList.add('low-memory-device');
      }
      
      // Enable battery optimization mode if needed
      if ('getBattery' in navigator) {
        navigator.getBattery().then(battery => {
          if (battery.level < 0.2) {
            document.documentElement.classList.add('battery-saver-mode');
          }
        });
      }
      
      // Cleanup
      return () => {
        window.removeEventListener('resize', resizeHandler);
        window.removeEventListener('orientationchange', orientationHandler);
      };
    }
  }, []);
  
  // Register service worker for video caching
  const registerVideoServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/video-sw.js', {
          scope: '/videos/'
        });
        
        
        // Listen for service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'activated') {
                // New video service worker activated
              }
            });
          }
        });
        
      } catch (error) {
        console.warn('Video SW registration failed:', error);
      }
    }
  };
  
  return null; // This component doesn't render anything
};

// Utility functions for better performance
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

function debounce(func, delay) {
  let timeoutId;
  return function() {
    const args = arguments;
    const context = this;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(context, args), delay);
  };
}

export default MobileLoadingOptimizer; 