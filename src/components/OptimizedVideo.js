import React, { useState, useRef, useEffect } from 'react';
import './OptimizedVideo.css';

const OptimizedVideo = ({ 
  src, 
  poster, 
  fallbackImage, 
  alt = "Video", 
  className = "", 
  style = {},
  autoPlay = true,
  muted = true,
  loop = true,
  playsInline = true,
  lazy = true
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(!lazy);
  const [hasError, setHasError] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const videoRef = useRef(null);
  const timeoutRef = useRef(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '50px 0px' // Start loading 50px before it comes into view
      }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => observer.disconnect();
  }, [lazy]);

  // Timeout fallback - if video doesn't load within 5 seconds, show fallback
  useEffect(() => {
    if (isVisible && !isLoaded) {
      timeoutRef.current = setTimeout(() => {
        setShowFallback(true);
      }, 5000); // 5 second timeout
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isVisible, isLoaded]);

  const handleVideoLoad = () => {
    setIsLoaded(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleVideoError = () => {
    setHasError(true);
    setShowFallback(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  // If there's an error or we should show fallback, render the fallback image
  if (hasError || showFallback) {
    return (
      <div ref={videoRef} className={`optimized-video-container ${className}`} style={style}>
        <img
          src={fallbackImage || poster}
          alt={alt}
          className="video-fallback-image"
          loading="lazy"
        />
        <div className="video-fallback-overlay">
          <div className="play-icon">▶</div>
        </div>
      </div>
    );
  }

  return (
    <div ref={videoRef} className={`optimized-video-container ${className}`} style={style}>
      {/* Poster/loading state */}
      {!isLoaded && poster && (
        <div className="video-poster">
          <img
            src={poster}
            alt={alt}
            className="poster-image"
            loading="lazy"
          />
          <div className="video-loading-overlay">
            <div className="loading-spinner"></div>
            <span className="loading-text">Loading video...</span>
          </div>
        </div>
      )}

      {/* Video element */}
      {isVisible && (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          className={`optimized-video ${isLoaded ? 'loaded' : 'loading'}`}
          autoPlay={autoPlay}
          muted={muted}
          loop={loop}
          playsInline={playsInline}
          preload="metadata" // Only load metadata initially
          onLoadedData={handleVideoLoad}
          onError={handleVideoError}
          style={style}
        >
          {/* Fallback content for browsers that don't support video */}
          <img
            src={fallbackImage || poster}
            alt={alt}
            className="video-fallback"
          />
        </video>
      )}
    </div>
  );
};

export default OptimizedVideo; 