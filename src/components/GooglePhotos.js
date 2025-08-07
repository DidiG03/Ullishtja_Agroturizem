import React, { useState, useEffect } from 'react';
import googleReviewsService from '../services/googleReviews';
import OptimizedImage from './OptimizedImage';
import './GooglePhotos.css';

const GooglePhotos = ({ currentLanguage, translations }) => {
  const [photosData, setPhotosData] = useState(null);
  const [loading, setLoading] = useState(true);
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
    setShowAllPhotos(!showAllPhotos);
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
              >
                <div className="photo-container">
                  <OptimizedImage
                    src={photo.url || photo.highResUrl}
                    alt={`Customer photo ${index + 1}`}
                    className="customer-photo"
                    loading={index < 4 ? "eager" : "lazy"}
                  />
                </div>
              </div>
            ))}
          </div>
          
          {hasMorePhotos && isMobile && (
            <div className="view-more">
              <button 
                className="view-more-btn"
                onClick={handleViewAllClick}
              >
                {showAllPhotos 
                  ? (t.customerPhotos?.showLess || 'Shiko më pak') 
                  : (t.customerPhotos?.viewAll || 'Shiko të gjitha')
                }
                <span className="photo-count">({photosData.photos.length})</span>
              </button>
            </div>
          )}
        </div>
      </section>


    </>
  );
};

export default GooglePhotos;