import React, { useState, useEffect, useCallback } from 'react';
import OptimizedImage from './OptimizedImage';
import './Gallery.css';

const Gallery = ({ currentLanguage, translations }) => {
  const t = translations;

  // Gallery images array
  const galleryImages = [
    {
      id: 1,
      src: "https://ucarecdn.com/81ed841e-eeaa-410d-9e4e-fdb3d48646a1/test.jpeg", // Fixed: using local image for now
      alt: "Traditional Albanian Food",
      category: "food"
    },
    {
      id: 2,
      src: "/images/panorama.jpeg",
      alt: "Restaurant Panorama View",
      category: "location"
    },
    {
      id: 3,
      src: "/images/logo_wall.jpeg", // Fixed: removed /public and corrected extension
      alt: "Restaurant Interior",
      category: "interior"
    },
    {
      id: 4,
      src: "/images/ullishtja_logo.jpeg",
      alt: "Ullishtja Agroturizem Logo",
      category: "branding"
    },
    {
      id: 5,
      src: "/images/test.jpeg",
      alt: "Restaurant Atmosphere",
      category: "ambiance"
    },
    {
      id: 6,
      src: "/images/food.jpeg",
      alt: "Traditional Cuisine",
      category: "food"
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Auto-advance carousel every 4 seconds
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === galleryImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, galleryImages.length]);

  // Pause auto-play when user interacts
  const pauseAutoPlay = useCallback(() => {
    setIsAutoPlaying(false);
  }, []);

  // Resume auto-play after 8 seconds of no interaction
  const resumeTimeoutRef = useRef(null);
  
  const resumeAutoPlay = useCallback(() => {
    // Clear any existing timeout to prevent multiple timers
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
    }
    
    resumeTimeoutRef.current = setTimeout(() => {
      setIsAutoPlaying(true);
      resumeTimeoutRef.current = null;
    }, 8000);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (resumeTimeoutRef.current) {
        clearTimeout(resumeTimeoutRef.current);
      }
    };
  }, []);

  // Navigation functions
  const goToNext = useCallback(() => {
    pauseAutoPlay();
    setCurrentIndex((prevIndex) => 
      prevIndex === galleryImages.length - 1 ? 0 : prevIndex + 1
    );
    resumeAutoPlay();
  }, [galleryImages.length, pauseAutoPlay, resumeAutoPlay]);

  const goToPrevious = useCallback(() => {
    pauseAutoPlay();
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? galleryImages.length - 1 : prevIndex - 1
    );
    resumeAutoPlay();
  }, [galleryImages.length, pauseAutoPlay, resumeAutoPlay]);

  const goToSlide = useCallback((index) => {
    pauseAutoPlay();
    setCurrentIndex(index);
    resumeAutoPlay();
  }, [pauseAutoPlay, resumeAutoPlay]);

  // Touch handlers for mobile swiping
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [goToNext, goToPrevious]);

  return (
    <section id="gallery" className="gallery">
      <div className="container">
        <div className="gallery-header">
          <h2 className="gallery-title">{t.gallery?.title || 'Our Gallery'}</h2>
          <p className="gallery-subtitle">
            {t.gallery?.subtitle || 'Discover the beauty and atmosphere of Ullishtja Agroturizem'}
          </p>
        </div>

        <div className="carousel-container">
          {/* Main carousel */}
          <div 
            className="carousel-track"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {galleryImages.map((image, index) => (
              <div key={image.id} className="carousel-slide">
                <div className="image-container">
                  <OptimizedImage
                    src={image.src}
                    alt={image.alt}
                    className="carousel-image"
                    loading={index === currentIndex ? "eager" : "lazy"}
                  />
                  <div className="image-overlay">
                    <div className="image-info">
                      <span className="image-category">{image.category}</span>
                      <h3 className="image-title">{image.alt}</h3>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation arrows */}
          <button 
            className="carousel-nav carousel-prev"
            onClick={goToPrevious}
            aria-label="Previous image"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          
          <button 
            className="carousel-nav carousel-next"
            onClick={goToNext}
            aria-label="Next image"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Dots indicator */}
          <div className="carousel-dots">
            {galleryImages.map((_, index) => (
              <button
                key={index}
                className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>

          {/* Auto-play indicator */}
          <div className="autoplay-indicator">
            <button 
              className={`autoplay-toggle ${isAutoPlaying ? 'playing' : 'paused'}`}
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              aria-label={isAutoPlaying ? 'Pause slideshow' : 'Play slideshow'}
            >
              {isAutoPlaying ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M6 4H10V20H6V4Z" fill="currentColor"/>
                  <path d="M14 4H18V20H14V4Z" fill="currentColor"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>
                </svg>
              )}
            </button>
            {isAutoPlaying && (
              <div className="autoplay-progress">
                <div className="progress-bar" key={currentIndex}></div>
              </div>
            )}
          </div>
        </div>

        {/* Thumbnail strip for desktop */}
        <div className="thumbnail-strip">
          {galleryImages.map((image, index) => (
            <button
              key={image.id}
              className={`thumbnail ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
            >
              <OptimizedImage
                src={image.src}
                alt={image.alt}
                className="thumbnail-image"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Gallery; 