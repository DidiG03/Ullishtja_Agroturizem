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
  const videoRef = useRef(null);

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

  // Auto-play when video becomes visible and loaded
  useEffect(() => {
    if (isLoaded && videoRef.current && autoPlay) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          // Auto-play was prevented, but that's okay
          console.log('Auto-play prevented:', error);
        });
      }
    }
  }, [isLoaded, autoPlay]);

  const handleVideoLoad = () => {
    setIsLoaded(true);
  };

  const handleVideoError = () => {
    setHasError(true);
  };

  // If there's an error, render the fallback image (no play button)
  if (hasError) {
    return (
      <div ref={videoRef} className={`optimized-video-container ${className}`} style={style}>
        <img
          src={fallbackImage || poster}
          alt={alt}
          className="video-fallback-image"
          loading="lazy"
        />
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
          preload="auto" // Load the entire video for immediate playback
          onCanPlay={handleVideoLoad} // Trigger when video can start playing
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