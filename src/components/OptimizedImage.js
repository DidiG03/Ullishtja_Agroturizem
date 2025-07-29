import React, { useState, useRef, useEffect } from 'react';

const OptimizedImage = ({ 
  src, 
  alt, 
  className = '', 
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  loading = 'lazy',
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef();

  // Extract filename without extension for WebP/JPEG variants
  const getImageVariants = (originalSrc) => {
    // Check if this is an external URL (starts with http/https)
    const isExternalUrl = originalSrc.startsWith('http://') || originalSrc.startsWith('https://');
    
    if (isExternalUrl) {
      // For external URLs, just use the original source without optimization
      return {
        webp: originalSrc,
        jpeg: originalSrc,
        fallback: originalSrc
      };
    }
    
    // For local images, use the original optimization logic
    const fileName = originalSrc.split('/').pop().split('.')[0];
    const basePath = originalSrc.substring(0, originalSrc.lastIndexOf('/'));
    
    return {
      webp: `${basePath}/gallery/${fileName}-original.webp`,
      jpeg: `${basePath}/gallery/${fileName}.jpg`,
      fallback: originalSrc
    };
  };

  const imageVariants = getImageVariants(src);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
  };

  // Check if browser supports WebP
  const supportsWebP = () => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  };

  const getOptimalSrc = () => {
    if (hasError) return imageVariants.fallback;
    
    // Check if this is an external URL
    const isExternalUrl = src.startsWith('http://') || src.startsWith('https://');
    
    if (isExternalUrl) {
      // For external URLs, just return the original URL
      return src;
    }
    
    // If image hasn't been processed yet, use original (for local images)
    if (src.includes('/images/') && !src.includes('/gallery/')) {
      return src;
    }
    
    return supportsWebP() ? imageVariants.webp : imageVariants.jpeg;
  };

  return (
    <div ref={imgRef} className={`optimized-image-container ${className}`}>
      {/* Loading placeholder */}
      {!isLoaded && (
        <div className="image-placeholder">
          <div className="loading-animation"></div>
        </div>
      )}
      
      {/* Main image - only load when in view or loading is eager */}
      {(isInView || loading === 'eager') && (
        <picture>
          {/* WebP source for modern browsers */}
          <source
            srcSet={`
              ${imageVariants.webp.replace('-original', '-mobile')} 600w,
              ${imageVariants.webp} 1200w
            `}
            sizes={sizes}
            type="image/webp"
          />
          
          {/* JPEG fallback */}
          <source
            srcSet={`
              ${imageVariants.jpeg.replace('.jpg', '-mobile.jpg')} 600w,
              ${imageVariants.jpeg} 1200w
            `}
            sizes={sizes}
            type="image/jpeg"
          />
          
          {/* Fallback img element */}
          <img
            src={getOptimalSrc()}
            alt={alt}
            loading={loading}
            onLoad={handleLoad}
            onError={handleError}
            className={`optimized-image ${isLoaded ? 'loaded' : 'loading'}`}
            {...props}
          />
        </picture>
      )}
    </div>
  );
};

export default OptimizedImage; 