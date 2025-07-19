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
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef(null);
  const observerRef = useRef(null);

  // Intersection Observer for lazy loading and viewport management
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const isCurrentlyInView = entry.isIntersecting;
        setIsInView(isCurrentlyInView);
        
        // For lazy loading
        if (lazy && isCurrentlyInView && !isVisible) {
          setIsVisible(true);
        }
        
        // Video playback management based on viewport
        if (videoRef.current && isLoaded) {
          const isMobile = window.innerWidth <= 768;
          
          if (isCurrentlyInView) {
            // Video is in view, play it
            if (autoPlay && videoRef.current.paused) {
              // Add small delay on mobile for smoother performance
              const delay = isMobile ? 100 : 0;
              setTimeout(() => {
                if (videoRef.current) {
                  const playPromise = videoRef.current.play();
                  if (playPromise !== undefined) {
                    playPromise.catch(error => {
                      console.log('Auto-play prevented:', error);
                    });
                  }
                }
              }, delay);
            }
          } else {
            // Video is out of view, pause it for better performance
            if (!videoRef.current.paused) {
              videoRef.current.pause();
            }
            
            // On mobile, also reset video position for memory optimization
            if (isMobile && videoRef.current.currentTime > 5) {
              videoRef.current.currentTime = 0;
            }
          }
        }
      },
      { 
        threshold: window.innerWidth <= 768 ? [0.3] : [0, 0.1, 0.5], // Simpler thresholds on mobile
        rootMargin: window.innerWidth <= 768 ? '50px 0px' : '20px 0px' // Larger margin on mobile for smoother experience
      }
    );

    observerRef.current = observer;

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [lazy, isLoaded, autoPlay]);

  // Auto-play when video becomes visible and loaded
  useEffect(() => {
    if (isLoaded && videoRef.current && autoPlay && isInView) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          // Auto-play was prevented, but that's okay
          console.log('Auto-play prevented:', error);
        });
      }
    }
  }, [isLoaded, autoPlay, isInView]);

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
      {/* Poster image - no loading spinner */}
      {!isLoaded && poster && (
        <div className="video-poster">
          <img
            src={poster}
            alt={alt}
            className="poster-image"
            loading="lazy"
          />
        </div>
      )}

      {/* Video element */}
      {isVisible && (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          className={`optimized-video ${isLoaded ? 'loaded' : 'loading'}`}
          autoPlay={false} // Controlled by intersection observer
          muted={muted}
          loop={loop}
          playsInline={playsInline}
          preload="metadata" // Balanced approach - load metadata, then auto when in view
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