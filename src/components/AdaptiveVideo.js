import React, { useState, useRef, useEffect, useMemo } from 'react';
import './AdaptiveVideo.css';

const AdaptiveVideo = ({ 
  videoId, // Base video identifier (e.g., 'dji-20240806130059-0020-d')
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
  priority = 'normal', // 'high', 'normal', 'low'
  maxQuality = 'desktop' // 'mobile', 'tablet', 'desktop'
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(!lazy);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSource, setCurrentSource] = useState(null);
  const [networkSpeed, setNetworkSpeed] = useState('fast');
  const videoRef = useRef(null);
  const observerRef = useRef(null);

  // Device and network detection
  const deviceInfo = useMemo(() => {
    const width = window.innerWidth;
    const pixelRatio = window.devicePixelRatio || 1;
    const isMobile = width <= 768;
    const isTablet = width > 768 && width <= 1024;
    const isDesktop = width > 1024;
    
    // Detect if device is low-powered
    const isLowPowerDevice = () => {
      const hardwareConcurrency = navigator.hardwareConcurrency || 2;
      const memory = navigator.deviceMemory || 4;
      return hardwareConcurrency <= 2 || memory <= 2;
    };

    // Network speed detection
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    let estimatedSpeed = 'fast';
    
    if (connection) {
      const { effectiveType, downlink } = connection;
      if (effectiveType === 'slow-2g' || effectiveType === '2g' || downlink < 1) {
        estimatedSpeed = 'slow';
      } else if (effectiveType === '3g' || downlink < 5) {
        estimatedSpeed = 'medium';
      }
    }

    return {
      width,
      pixelRatio,
      isMobile,
      isTablet,
      isDesktop,
      isLowPower: isLowPowerDevice(),
      supportsWebM: document.createElement('video').canPlayType('video/webm') !== '',
      supportsAV1: document.createElement('video').canPlayType('video/webm; codecs="av01.0.05M.08"') !== '',
      estimatedSpeed
    };
  }, []);

  // Generate optimal video sources based on device capabilities
  const videoSources = useMemo(() => {
    if (!videoId) return [];

    const { isMobile, isTablet, isDesktop, isLowPower, supportsWebM, supportsAV1, estimatedSpeed } = deviceInfo;
    
    // Determine optimal quality based on device and settings
    let targetQuality = 'mobile';
    if (isTablet && maxQuality !== 'mobile') targetQuality = 'tablet';
    if (isDesktop && maxQuality === 'desktop') targetQuality = 'desktop';
    
    // Reduce quality for low-power devices or slow networks
    if (isLowPower || estimatedSpeed === 'slow') {
      targetQuality = 'mobile';
    } else if (estimatedSpeed === 'medium' && targetQuality === 'desktop') {
      targetQuality = 'tablet';
    }

    const basePath = '/videos/';
    const sources = [];

    // AV1 (most efficient, newest browsers)
    if (supportsAV1 && estimatedSpeed === 'fast' && !isLowPower) {
      sources.push({
        src: `${basePath}${videoId}-${targetQuality}.av1.mp4`,
        type: 'video/mp4; codecs="av01.0.05M.08"',
        quality: targetQuality,
        format: 'av1'
      });
    }

    // WebM (good compression, wide support)
    if (supportsWebM) {
      sources.push({
        src: `${basePath}${videoId}-${targetQuality}.webm`,
        type: 'video/webm',
        quality: targetQuality,
        format: 'webm'
      });
    }

    // MP4 (universal fallback)
    sources.push({
      src: `${basePath}${videoId}-${targetQuality}.mp4`,
      type: 'video/mp4',
      quality: targetQuality,
      format: 'mp4'
    });

    // Mobile fallback for slow connections
    if (estimatedSpeed === 'slow' && targetQuality !== 'mobile') {
      sources.push({
        src: `${basePath}${videoId}-mobile.mp4`,
        type: 'video/mp4',
        quality: 'mobile',
        format: 'mp4'
      });
    }

    return sources;
  }, [videoId, deviceInfo, maxQuality]);

  // Preload strategy based on priority and network
  const preloadStrategy = useMemo(() => {
    const { estimatedSpeed, isMobile } = deviceInfo;
    
    if (priority === 'high') return 'auto';
    if (priority === 'low') return 'none';
    
    // Adaptive preloading based on network and device
    if (estimatedSpeed === 'slow') return 'none';
    if (estimatedSpeed === 'medium') return 'metadata';
    if (isMobile && estimatedSpeed === 'fast') return 'metadata';
    
    return 'metadata';
  }, [priority, deviceInfo]);

  // Network speed monitoring
  useEffect(() => {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
      const updateNetworkSpeed = () => {
        const { effectiveType, downlink } = connection;
        let speed = 'fast';
        
        if (effectiveType === 'slow-2g' || effectiveType === '2g' || downlink < 1) {
          speed = 'slow';
        } else if (effectiveType === '3g' || downlink < 5) {
          speed = 'medium';
        }
        
        setNetworkSpeed(speed);
      };

      connection.addEventListener('change', updateNetworkSpeed);
      return () => connection.removeEventListener('change', updateNetworkSpeed);
    }
  }, []);

  // Enhanced Intersection Observer with mobile optimizations
  useEffect(() => {
    const { isMobile } = deviceInfo;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        const isCurrentlyInView = entry.isIntersecting;
        setIsInView(isCurrentlyInView);
        
        // For lazy loading
        if (lazy && isCurrentlyInView && !isVisible) {
          setIsVisible(true);
        }
        
        // Enhanced video playback management
        if (videoRef.current && isLoaded) {
          if (isCurrentlyInView) {
            // Video is in view, play it
            if (autoPlay && videoRef.current.paused) {
              // Longer delay on mobile for smoother performance
              const delay = isMobile ? 150 : 50;
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
            
            // Enhanced memory optimization for mobile
            if (isMobile) {
              // Reset video position more aggressively on mobile
              if (videoRef.current.currentTime > 3) {
                videoRef.current.currentTime = 0;
              }
              
              // Clear any buffered data on low-power devices
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
        threshold: isMobile ? [0.25] : [0, 0.1, 0.5],
        rootMargin: isMobile ? '75px 0px' : '50px 0px'
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
  }, [lazy, isLoaded, autoPlay, deviceInfo]);

  const handleVideoLoad = () => {
    setIsLoaded(true);
  };

  const handleVideoError = (e) => {
    console.warn('Video failed to load:', e.target.src);
    setHasError(true);
  };

  // If there's an error, render the fallback image
  if (hasError) {
    return (
      <div ref={videoRef} className={`adaptive-video-container error ${className}`} style={style}>
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
    <div ref={videoRef} className={`adaptive-video-container ${className}`} style={style}>
      {/* Poster image */}
      {!isLoaded && poster && (
        <div className="video-poster">
          <img
            src={poster}
            alt={alt}
            className="poster-image"
            loading={priority === 'high' ? 'eager' : 'lazy'}
          />
        </div>
      )}

      {/* Video element with adaptive sources */}
      {isVisible && (
        <video
          ref={videoRef}
          poster={poster}
          className={`adaptive-video ${isLoaded ? 'loaded' : 'loading'}`}
          autoPlay={false} // Controlled by intersection observer
          muted={muted}
          loop={loop}
          playsInline={playsInline}
          preload={preloadStrategy}
          onCanPlay={handleVideoLoad}
          onError={handleVideoError}
          style={style}
        >
          {videoSources.map((source, index) => (
            <source
              key={index}
              src={source.src}
              type={source.type}
              onError={index === videoSources.length - 1 ? handleVideoError : undefined}
            />
          ))}
          
          {/* Fallback content */}
          <img
            src={fallbackImage || poster}
            alt={alt}
            className="video-fallback"
          />
        </video>
      )}

      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && currentSource && (
        <div className="video-debug-info">
          <small>
            Quality: {currentSource.quality} | Format: {currentSource.format} | 
            Network: {networkSpeed} | Device: {deviceInfo.isMobile ? 'Mobile' : deviceInfo.isTablet ? 'Tablet' : 'Desktop'}
          </small>
        </div>
      )}
    </div>
  );
};

export default AdaptiveVideo; 