import React, { useState, useRef, useEffect } from 'react';
import intelligentVideoPreloader from '../services/intelligentVideoPreloader';
import './OptimizedVideo.css';

const OptimizedVideo = ({ 
  src, 
  videoId, // New prop for intelligent loading
  poster, 
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

  // Intersection Observer for lazy loading and viewport management
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const isCurrentlyInView = entry.isIntersecting;
        setIsInView(isCurrentlyInView);
        
        // Track user interaction for intelligent preloading
        if (videoId && isCurrentlyInView) {
          intelligentVideoPreloader.trackUserInteraction('video_view', videoId, {
            viewportPercentage: entry.intersectionRatio
          });
        }
        
        // For lazy loading
        if (lazy && isCurrentlyInView && !isVisible) {
          setIsVisible(true);
        }
        
        // Enhanced video playback management based on viewport
        if (videoRef.current && isLoaded) {
          const isMobile = window.innerWidth <= 768;
          
          if (isCurrentlyInView) {
            // Video is in view, play it
            if (autoPlay && videoRef.current.paused) {
              // Enhanced delay calculation based on device and network
              const networkInfo = intelligentVideoPreloader.networkInfo;
              const isSlowNetwork = networkInfo.effectiveType === '3g' || networkInfo.downlink < 3;
              const delay = isMobile ? (isSlowNetwork ? 200 : 150) : 50;
              
              setTimeout(() => {
                if (videoRef.current) {
                  const playPromise = videoRef.current.play();
                  if (playPromise !== undefined) {
                    playPromise.catch(error => {
                      // Auto-play was prevented, but that's okay
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
            
            // Enhanced memory optimization for mobile
            if (isMobile) {
              const deviceInfo = intelligentVideoPreloader.deviceInfo;
              const resetThreshold = deviceInfo.isLowPower ? 3 : 5;
              
              if (videoRef.current.currentTime > resetThreshold) {
                videoRef.current.currentTime = 0;
              }
              
              // More aggressive cleanup on low-power devices
              if (deviceInfo.isLowPower) {
                try {
                  videoRef.current.load();
                } catch (e) {
                  // Ignore errors
                }
              }
            }
          }
        }
      },
      { 
        threshold: window.innerWidth <= 768 ? [0.25] : [0, 0.1, 0.5],
        rootMargin: window.innerWidth <= 768 ? '75px 0px' : '50px 0px'
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
  }, [lazy, isLoaded, autoPlay, videoId]);

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

      {/* Video element with adaptive sources */}
      {isVisible && (
        <video
          ref={videoRef}
          poster={poster}
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