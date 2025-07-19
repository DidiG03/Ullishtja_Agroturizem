import React, { useRef, useEffect, useState, useCallback } from 'react';
import './ScrollControlledVideo.css';

const ScrollControlledVideo = ({ 
  src, 
  poster, 
  title, 
  subtitle, 
  description,
  className = '',
  ...props 
}) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [isInView, setIsInView] = useState(false);

  // Handle video load
  const handleVideoLoad = useCallback(() => {
    setIsVideoLoaded(true);
  }, []);

  // Calculate scroll progress and update video
  const updateVideoProgress = useCallback(() => {
    if (!videoRef.current || !containerRef.current || !isVideoLoaded) return;

    const video = videoRef.current;
    const container = containerRef.current;
    
    // Get container position relative to viewport
    const rect = container.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    
    // Calculate when element starts entering and fully exits viewport
    const elementTop = rect.top;
    const elementBottom = rect.bottom;
    const elementHeight = rect.height;
    
    // Element is considered "in view" when any part is visible
    const inView = elementTop < windowHeight && elementBottom > 0;
    setIsInView(inView);
    
    if (!inView) return;

    // Calculate scroll progress (0 to 1)
    // Start when element top enters bottom of screen
    // End when element bottom exits top of screen
    const scrollStart = windowHeight;
    const scrollEnd = -elementHeight;
    const scrollDistance = scrollStart - scrollEnd;
    const currentScroll = elementTop - scrollEnd;
    
    let progress = 1 - (currentScroll / scrollDistance);
    progress = Math.max(0, Math.min(1, progress));
    
    setVideoProgress(progress);
    
    // Update video time based on scroll progress
    const videoDuration = video.duration;
    if (videoDuration && isFinite(videoDuration)) {
      const targetTime = progress * videoDuration;
      
      // Only update if the difference is significant to avoid jittery playback
      if (Math.abs(video.currentTime - targetTime) > 0.1) {
        video.currentTime = targetTime;
      }
    }
  }, [isVideoLoaded]);

  // Throttled scroll handler with mobile optimizations
  useEffect(() => {
    let ticking = false;
    const isMobile = window.innerWidth <= 768;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateVideoProgress();
          ticking = false;
        });
        ticking = true;
      }
    };

    // More aggressive throttling on mobile for better performance
    const throttledScroll = isMobile ? 
      (() => {
        let timeoutId;
        return () => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(handleScroll, 16); // ~60fps
        };
      })() : 
      handleScroll;

    // Initial calculation
    updateVideoProgress();
    
    // Add scroll listener
    window.addEventListener('scroll', throttledScroll, { passive: true });
    window.addEventListener('resize', updateVideoProgress, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', throttledScroll);
      window.removeEventListener('resize', updateVideoProgress);
    };
  }, [updateVideoProgress]);

  // Intersection Observer for performance optimization
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            updateVideoProgress();
          }
        });
      },
      {
        threshold: 0,
        rootMargin: '50px 0px'
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [updateVideoProgress]);

  return (
    <section 
      ref={containerRef} 
      className={`scroll-controlled-video-section ${className}`}
      {...props}
    >
      <div className="scroll-video-container">
        <div className="scroll-video-content">
          <div className="scroll-video-text">
            {title && <h2 className="scroll-video-title">{title}</h2>}
            {subtitle && <h3 className="scroll-video-subtitle">{subtitle}</h3>}
            {description && (
              <div className="scroll-video-description">
                {description.split('\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            )}
          </div>
          
          <div className="scroll-video-player">
            <video
              ref={videoRef}
              poster={poster}
              preload="metadata"
              muted
              playsInline
              onLoadedData={handleVideoLoad}
              onLoadedMetadata={handleVideoLoad}
              className="scroll-video"
            >
              <source src={src} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </div>
      
      {/* Scroll hint */}
      {isInView && videoProgress < 0.1 && (
        <div className="scroll-hint">
          <div className="scroll-hint-icon">
            <span>↓</span>
          </div>
          <p>Scroll to explore</p>
        </div>
      )}
    </section>
  );
};

export default ScrollControlledVideo; 