import React, { useState, useEffect } from 'react';
import AdaptiveVideo from './AdaptiveVideo';
import intelligentVideoPreloader from '../services/intelligentVideoPreloader';

const HeroVideoSection = ({ 
  videoId = 'dji-20240806130059-0020-d',
  title,
  subtitle,
  className = ''
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [networkMetrics, setNetworkMetrics] = useState(null);

  useEffect(() => {
    // Get performance metrics for debugging
    const metrics = intelligentVideoPreloader.getPerformanceMetrics();
    setNetworkMetrics(metrics);
    
    // Preload hero video with highest priority
    intelligentVideoPreloader.preloadVideo(videoId, 'high');
  }, [videoId]);

  const handleVideoLoad = () => {
    setIsLoaded(true);
  };

  return (
    <section className={`hero-video-section ${className}`}>
      <div className="hero-video-container">
        <AdaptiveVideo
          videoId={videoId}
          poster={`/videos/${videoId}-poster.jpg`}
          fallbackImage={`/videos/${videoId}-poster.jpg`}
          alt="Ullishtja Agroturizem Hero Video"
          className="hero-video"
          autoPlay={true}
          muted={true}
          loop={true}
          playsInline={true}
          lazy={false} // Don't lazy load hero video
          priority="high"
          maxQuality="desktop"
          onLoad={handleVideoLoad}
        />
        
        {/* Hero content overlay */}
        <div className="hero-content-overlay">
          <div className="hero-content">
            {title && (
              <h1 className="hero-title">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="hero-subtitle">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Loading indicator for slow networks */}
        {!isLoaded && (
          <div className="hero-loading-indicator">
            <div className="loading-spinner"></div>
            <p>Loading video...</p>
          </div>
        )}
      </div>

      {/* Development metrics */}
      {process.env.NODE_ENV === 'development' && networkMetrics && (
        <div className="hero-debug-metrics">
          <h4>Video Performance Metrics</h4>
          <ul>
            <li>Device: {networkMetrics.deviceType}</li>
            <li>Network: {networkMetrics.networkType}</li>
            <li>Preloaded Videos: {networkMetrics.preloadedCount}</li>
            <li>Memory Usage: ~{networkMetrics.memoryUsage}MB</li>
            <li>Battery Optimization: {networkMetrics.batteryOptimization ? 'ON' : 'OFF'}</li>
          </ul>
        </div>
      )}

      <style jsx>{`
        .hero-video-section {
          position: relative;
          width: 100%;
          height: 100vh;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hero-video-container {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .hero-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .hero-content-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            45deg,
            rgba(0, 0, 0, 0.4) 0%,
            rgba(0, 0, 0, 0.1) 50%,
            rgba(0, 0, 0, 0.3) 100%
          );
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
        }

        .hero-content {
          text-align: center;
          color: white;
          max-width: 800px;
          padding: 2rem;
        }

        .hero-title {
          font-size: 4rem;
          font-weight: 800;
          margin-bottom: 1rem;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
          line-height: 1.1;
        }

        .hero-subtitle {
          font-size: 1.5rem;
          font-weight: 400;
          margin: 0;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
          opacity: 0.9;
        }

        .hero-loading-indicator {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          color: white;
          z-index: 3;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top: 3px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .hero-debug-metrics {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 1rem;
          border-radius: 8px;
          font-size: 0.8rem;
          z-index: 10;
          max-width: 300px;
        }

        .hero-debug-metrics h4 {
          margin: 0 0 0.5rem;
          font-size: 0.9rem;
        }

        .hero-debug-metrics ul {
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .hero-debug-metrics li {
          margin-bottom: 0.25rem;
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .hero-title {
            font-size: 2.5rem;
          }

          .hero-subtitle {
            font-size: 1.2rem;
          }

          .hero-content {
            padding: 1rem;
          }

          .hero-debug-metrics {
            font-size: 0.7rem;
            padding: 0.5rem;
            top: 5px;
            right: 5px;
          }
        }

        @media (max-width: 480px) {
          .hero-title {
            font-size: 2rem;
          }

          .hero-subtitle {
            font-size: 1rem;
          }
        }

        /* Accessibility */
        @media (prefers-reduced-motion: reduce) {
          .loading-spinner {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
};

export default HeroVideoSection; 