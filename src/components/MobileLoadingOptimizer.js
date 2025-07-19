import { useEffect } from 'react';

const MobileLoadingOptimizer = () => {
  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
      // Preload critical images for mobile
      const criticalImages = [
        '/images/ullishtja_logo.jpeg',
        '/videos/dji-20240806130059-0020-d-poster.jpg',
        '/images/food.jpeg'
      ];
      
      criticalImages.forEach(src => {
        const img = new Image();
        img.src = src;
      });
      
      // Add loading priority hints
      const images = document.querySelectorAll('img');
      images.forEach((img, index) => {
        if (index < 3) {
          img.setAttribute('fetchpriority', 'high');
        } else {
          img.setAttribute('loading', 'lazy');
        }
      });
      
      // Optimize scroll performance for mobile
      document.body.style.setProperty('-webkit-overflow-scrolling', 'touch');
      document.body.style.setProperty('overscroll-behavior', 'none');
      
      // Set initial viewport height
      const setVH = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      };
      
      setVH();
      window.addEventListener('resize', setVH, { passive: true });
      window.addEventListener('orientationchange', setVH, { passive: true });
      
      // Cleanup
      return () => {
        window.removeEventListener('resize', setVH);
        window.removeEventListener('orientationchange', setVH);
      };
    }
  }, []);
  
  return null; // This component doesn't render anything
};

export default MobileLoadingOptimizer; 