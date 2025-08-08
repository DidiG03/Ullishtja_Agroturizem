import React, { useState, useRef, useEffect } from 'react';
import intelligentVideoPreloader from '../services/intelligentVideoPreloader';
import './OptimizedVideo.css';

const OptimizedVideo = ({ 
  src, 
  videoId, // New prop for intelligent loading
  poster, 
  mobilePoster, // Optional poster used only on small screens
  fallbackImage, 
  alt = "Video", 
  className = "", 
  style = {},
  autoPlay = true,
  muted = true,
  loop = true,
  playsInline = true,
  lazy = true,
  priority = 'normal' // New prop for preloading priority
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(!lazy);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [videoSources, setVideoSources] = useState([]);
  const [preloadedVideo, setPreloadedVideo] = useState(null);
  const videoRef = useRef(null);
  const observerRef = useRef(null);
  const [posterSrc, setPosterSrc] = useState(poster);

  // Choose poster based on screen size (mobile vs desktop/tablet)
  useEffect(() => {
    // If a mobile-specific poster is provided, use it on small screens
    const mediaQuery = '(max-width: 768px)';
    try {
      const mql = window.matchMedia(mediaQuery);
      const updatePoster = () => {
        if (mobilePoster && mql.matches) {
          setPosterSrc(mobilePoster);
        } else {
          setPosterSrc(poster);
        }
      };
      updatePoster();

      // Listen for viewport changes
      if (mql.addEventListener) {
        mql.addEventListener('change', updatePoster);
        return () => mql.removeEventListener('change', updatePoster);
      } else if (mql.addListener) {
        mql.addListener(updatePoster);
        return () => mql.removeListener(updatePoster);
      }
    } catch (_) {
      // Fallback if matchMedia is unavailable
      setPosterSrc(poster);
    }
  }, [poster, mobilePoster]);

  // Initialize video sources and check for preloaded videos
  useEffect(() => {
    if (videoId) {
      // Check if video is already preloaded
      const preloaded = intelligentVideoPreloader.getPreloadedVideo(videoId);
      if (preloaded) {
        setPreloadedVideo(preloaded);
        setVideoSources([preloaded.source]);
      } else {
        // Generate adaptive sources
        const optimalSource = intelligentVideoPreloader.getOptimalVideoSource(videoId, priority);
        setVideoSources([optimalSource]);
        
        // Preload for future use if priority is high
        if (priority === 'high') {
          intelligentVideoPreloader.preloadVideo(videoId, priority);
        }
      }
    } else if (src) {
      // Fallback to traditional src prop
      setVideoSources([{ src, format: 'mp4', quality: 'unknown' }]);
    }
  }, [videoId, src, priority]);

  // Simplified Intersection Observer for better performance
  useEffect(() => {
    if (!lazy) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isCurrentlyInView = entry.isIntersecting;
        setIsInView(isCurrentlyInView);
        
        // Simple lazy loading
        if (isCurrentlyInView && !isVisible) {
          setIsVisible(true);
        }
        
        // Simple video playback management
        if (videoRef.current && isLoaded) {
          if (isCurrentlyInView && autoPlay && videoRef.current.paused) {
            // Simple play with minimal delay
            setTimeout(() => {
              if (videoRef.current) {
                videoRef.current.play().catch(() => {
                  // Auto-play prevented, ignore
                });
              }
            }, 100);
          } else if (!isCurrentlyInView && !videoRef.current.paused) {
            // Pause when out of view
            videoRef.current.pause();
          }
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [lazy, isLoaded, autoPlay, isVisible]);

  // Auto-play when video becomes visible and loaded
  useEffect(() => {
    if (isLoaded && videoRef.current && autoPlay && isInView) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          // Auto-play was prevented, but that's okay
        });
      }
    }
  }, [isLoaded, autoPlay, isInView]);

  const handleVideoLoad = () => {
    setIsLoaded(true);
    
    // Track successful video load
    if (videoId) {
      intelligentVideoPreloader.trackUserInteraction('video_loaded', videoId, {
        loadTime: Date.now()
      });
    }
  };

  const handleVideoError = (e) => {
    console.warn('Video failed to load:', e.target?.src);
    setHasError(true);
    
    // Track video error for analytics
    if (videoId) {
      intelligentVideoPreloader.trackUserInteraction('video_error', videoId, {
        error: e.target?.error?.message || 'Unknown error',
        src: e.target?.src
      });
    }
  };

  // If there's an error, render the fallback image (no play button)
  if (hasError) {
    return (
      <div ref={videoRef} className={`optimized-video-container ${className}`} style={style}>
        <img
          src={fallbackImage || posterSrc}
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
      {!isLoaded && posterSrc && (
        <div className="video-poster">
          <img
            src={posterSrc}
            alt={alt}
            className="poster-image"
            loading={priority === 'high' ? 'eager' : 'lazy'}
            decoding={priority === 'high' ? 'sync' : 'async'}
            fetchpriority={priority === 'high' ? 'high' : undefined}
          />
        </div>
      )}

      {/* Video element with adaptive sources */}
      {isVisible && (
        <video
          ref={videoRef}
          poster={posterSrc}
          className={`optimized-video ${isLoaded ? 'loaded' : 'loading'}`}
          autoPlay={false} // Controlled by intersection observer
          muted={muted}
          loop={loop}
          playsInline={playsInline}
          preload={preloadedVideo ? "auto" : "metadata"}
          onCanPlay={handleVideoLoad}
          onError={handleVideoError}
          style={style}
        >
          {/* Multiple sources for progressive enhancement */}
          {videoSources.map((source, index) => (
            <source
              key={index}
              src={source.src}
              type={source.type || `video/${source.format}`}
              onError={index === videoSources.length - 1 ? handleVideoError : undefined}
            />
          ))}
          
          {/* Fallback content for browsers that don't support video */}
          <img
            src={fallbackImage || posterSrc}
            alt={alt}
            className="video-fallback"
          />
        </video>
      )}
    </div>
  );
};

export default OptimizedVideo; 