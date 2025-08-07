import React, { useState, useRef, useEffect } from 'react';
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
  lazy = true
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(!lazy);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [videoSrc, setVideoSrc] = useState('');
  const videoRef = useRef(null);

  // Simplified device detection
  const isMobile = window.innerWidth <= 768;

  // Simple video source selection
  useEffect(() => {
    if (!videoId) return;
    
    // Choose appropriate video quality based on screen size
    const quality = isMobile ? 'mobile' : 'desktop';
    const format = 'mp4'; // Simplified to just MP4
    const src = `/videos/${videoId}-${quality}.${format}`;
    setVideoSrc(src);
  }, [videoId, isMobile]);

  // Simple intersection observer for lazy loading
  useEffect(() => {
    if (!lazy) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          setIsInView(true);
        } else {
          setIsInView(false);
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [lazy]);

  // Simple video event handlers
  const handleVideoLoad = () => {
    setIsLoaded(true);
  };

  const handleVideoError = () => {
    setHasError(true);
  };

  // Auto-play when in view
  useEffect(() => {
    if (isLoaded && videoRef.current && autoPlay && isInView) {
      videoRef.current.play().catch(() => {
        // Auto-play prevented, ignore
      });
    } else if (videoRef.current && !isInView) {
      videoRef.current.pause();
    }
  }, [isLoaded, autoPlay, isInView]);

  // Error state
  if (hasError && fallbackImage) {
    return (
      <div ref={videoRef} className={`adaptive-video-container ${className}`} style={style}>
        <img
          src={fallbackImage}
          alt={alt}
          className="video-fallback-image"
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
            loading="lazy"
          />
        </div>
      )}

      {/* Video element */}
      {isVisible && videoSrc && (
        <video
          ref={videoRef}
          poster={poster}
          className={`adaptive-video ${isLoaded ? 'loaded' : 'loading'}`}
          autoPlay={false} // Controlled by intersection observer
          muted={muted}
          loop={loop}
          playsInline={playsInline}
          preload="metadata"
          onCanPlay={handleVideoLoad}
          onError={handleVideoError}
          style={style}
        >
          <source src={videoSrc} type="video/mp4" />
          
          {/* Fallback content */}
          <img
            src={fallbackImage || poster}
            alt={alt}
            className="video-fallback"
          />
        </video>
      )}

      {/* Development info */}
      {process.env.NODE_ENV === 'development' && videoSrc && (
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '5px',
          fontSize: '12px',
          borderRadius: '3px'
        }}>
          Source: {videoSrc.split('/').pop()}
        </div>
      )}
    </div>
  );
};

export default AdaptiveVideo;