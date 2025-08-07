import React, { useState, useEffect, useCallback } from 'react';
import googleReviewsService from '../services/googleReviews';
import OptimizedImage from './OptimizedImage';
import './GooglePhotos.css';

const GooglePhotos = ({ currentLanguage, translations }) => {
  const [photosData, setPhotosData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showAllPhotos, setShowAllPhotos] = useState(false);

  const t = translations;

  // Check if screen is mobile
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    const loadPhotos = async () => {
      try {
        const data = await googleReviewsService.fetchGooglePlacePhotos();
        setPhotosData(data);
      } catch (error) {
        console.error('Error loading photos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPhotos();
  }, []);

  const openLightbox = useCallback((photo, index) => {
    setSelectedPhoto(photo);
    setCurrentIndex(index);
    setShowLightbox(true);
    // Prevent body scroll when lightbox is open
    document.body.style.overflow = 'hidden';
  }, []);

  const closeLightbox = useCallback(() => {
    setShowLightbox(false);
    setSelectedPhoto(null);
    // Restore body scroll
    document.body.style.overflow = 'unset';
  }, []);

  const goToNext = useCallback(() => {
    if (photosData && photosData.photos.length > 0) {
      const nextIndex = (currentIndex + 1) % photosData.photos.length;
      setCurrentIndex(nextIndex);
      setSelectedPhoto(photosData.photos[nextIndex]);
    }
  }, [currentIndex, photosData]);

  const goToPrevious = useCallback(() => {
    if (photosData && photosData.photos.length > 0) {
      const prevIndex = currentIndex === 0 ? photosData.photos.length - 1 : currentIndex - 1;
      setCurrentIndex(prevIndex);
      setSelectedPhoto(photosData.photos[prevIndex]);
    }
  }, [currentIndex, photosData]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!showLightbox) return;
      
      switch (e.key) {
        case 'ArrowRight':
          goToNext();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'Escape':
          closeLightbox();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showLightbox, goToNext, goToPrevious, closeLightbox]);

  if (loading) {
    return (
      <section id="customer-photos" className="customer-photos">
        <div className="container">
          <div className="photos-header">
            <h2>{t.customerPhotos?.title || 'Customer Photos'}</h2>
            <p>{t.customerPhotos?.subtitle || 'See what our guests are sharing'}</p>
          </div>
          <div className="photos-loading">
            <div className="loading-grid">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="loading-photo"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!photosData || !photosData.photos || photosData.photos.length === 0) {
    return null; // Don't render if no photos
  }

  // Determine how many photos to show based on screen size and showAllPhotos state
  const getPhotosToShow = () => {
    if (isMobile) {
      if (showAllPhotos) {
        return photosData.photos;
      } else {
        // Show a diverse selection: 1st, 3rd, and 5th photos (or available ones)
        // Alternative options (uncomment the one you prefer):
        
        // Option 1: Skip first photo, show 2nd, 4th, 6th
        // const selectedIndices = [1, 3, 5].filter(index => index < photosData.photos.length);
        
        // Option 2: Show photos from the middle range
        // const startIndex = Math.max(0, Math.floor(photosData.photos.length / 3));
        // const selectedIndices = [startIndex, startIndex + 1, startIndex + 2].filter(index => index < photosData.photos.length);
        
        // Option 3: Random selection (changes each time)
        // const availableIndices = photosData.photos.map((_, index) => index);
        // const shuffled = availableIndices.sort(() => 0.5 - Math.random()).slice(0, 3);
        // return shuffled.map(index => photosData.photos[index]);
        
        // Current: 2nd, 3rd, 5th photos (skipping the first image)
        const selectedIndices = [7, 8, 4].filter(index => index < photosData.photos.length);
        return selectedIndices.map(index => photosData.photos[index]);
      }
    }
    return photosData.photos.slice(0, 8);
  };

  const photosToShow = getPhotosToShow();
  const hasMorePhotos = isMobile ? photosData.photos.length > 3 : photosData.photos.length > 8;

  const handleViewAllClick = () => {
    if (isMobile) {
      setShowAllPhotos(!showAllPhotos);
    } else {
      openLightbox(photosData.photos[0], 0);
    }
  };

  return (
    <>
      <section id="customer-photos" className="customer-photos">
        <div className="container">
          <div className="photos-header">
            <h2>{t.customerPhotos?.title || 'Customer Photos'}</h2>
            <p>{t.customerPhotos?.subtitle || 'See what our guests are sharing'}</p>
          </div>
          
          <div className="photos-grid">
            {photosToShow.map((photo, index) => (
              <div 
                key={photo.id} 
                className={`photo-item ${(index === 0 && !isMobile) ? 'featured' : ''}`}
                onClick={() => openLightbox(photo, index)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    openLightbox(photo, index);
                  }
                }}
              >
                <div className="photo-container">
                  <OptimizedImage
                    src={photo.url || photo.highResUrl}
                    alt={`Customer photo ${index + 1}`}
                    className="customer-photo"
                    loading={index < 4 ? "eager" : "lazy"}
                  />
                  <div className="photo-overlay">
                    <div className="photo-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M15 3H6C5.175 3 4.5 3.675 4.5 4.5V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M10.5 3H18C18.825 3 19.5 3.675 19.5 4.5V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M19.5 16.5V18C19.5 18.825 18.825 19.5 18 19.5H6C5.175 19.5 4.5 18.825 4.5 18V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {hasMorePhotos && (
            <div className="view-more">
              <button 
                className="view-more-btn"
                onClick={handleViewAllClick}
              >
                {isMobile && showAllPhotos 
                  ? (t.customerPhotos?.showLess || 'Shiko më pak') 
                  : (t.customerPhotos?.viewAll || 'Shiko të gjitha')
                }
                <span className="photo-count">({photosData.photos.length})</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      {showLightbox && selectedPhoto && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          <div className="lightbox-container" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={closeLightbox}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            
            <div className="lightbox-content">
              <button className="lightbox-nav lightbox-prev" onClick={goToPrevious}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              <div className="lightbox-image-container">
                <OptimizedImage
                  src={selectedPhoto.highResUrl || selectedPhoto.url}
                  alt={`Customer photo ${currentIndex + 1}`}
                  className="lightbox-image"
                  loading="eager"
                />
              </div>
              
              <button className="lightbox-nav lightbox-next" onClick={goToNext}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            
            <div className="lightbox-info">
              <span className="photo-counter">
                {currentIndex + 1} / {photosData.photos.length}
              </span>
              {selectedPhoto.attributions && selectedPhoto.attributions.length > 0 && (
                <div className="photo-attribution">
                  {selectedPhoto.attributions[0]}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GooglePhotos;