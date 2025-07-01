import React, { useState, useEffect } from 'react';
import googleReviewsService from '../services/googleReviews';
import './GoogleReviews.css';

const GoogleReviews = () => {
  const [reviewsData, setReviewsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(3);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const data = await googleReviewsService.fetchGoogleReviews();
        const highRatingReviews = googleReviewsService.getHighRatingReviews(data);
        setReviewsData(highRatingReviews);
      } catch (error) {
        console.error('Error loading reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, []);

  const handleShowMore = () => {
    setDisplayCount(prev => Math.min(prev + 3, reviewsData.reviews.length));
  };

  const handleShowLess = () => {
    setDisplayCount(3);
  };

  if (loading) {
    return (
      <div className="reviews-loading">
        <div className="loading-spinner"></div>
        <p>Loading reviews...</p>
      </div>
    );
  }

  if (!reviewsData || reviewsData.reviews.length === 0) {
    return (
      <div className="reviews-error">
        <p>Unable to load reviews at this time.</p>
      </div>
    );
  }

  return (
    <section className="google-reviews-section">
      <div className="container">
        <div className="reviews-header">
          <h2>What Our Guests Say</h2>
          <div className="overall-rating">
            <div className="rating-display">
              <div className="rating-stars">
                {googleReviewsService.generateStarDisplay(reviewsData.averageRating)}
              </div>
              <div className="rating-info">
                <span className="rating-number">
                  {googleReviewsService.formatRating(reviewsData.averageRating)}
                </span>
                <span className="rating-based-on">
                  Based on {reviewsData.totalReviews} Google reviews
                </span>
              </div>
            </div>
            <a 
              href="https://www.google.com/search?q=Ullishtja+Agroturizem+reviews" 
              target="_blank" 
              rel="noopener noreferrer"
              className="google-link"
            >
              <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" />
              View on Google
            </a>
          </div>
        </div>

        <div className="reviews-grid">
          {reviewsData.reviews.slice(0, displayCount).map((review) => (
            <div key={review.id} className="review-card">
              <div className="review-header">
                <div className="reviewer-info">
                  {review.authorPhotoUrl ? (
                    <img 
                      src={review.authorPhotoUrl} 
                      alt={review.authorName} 
                      className="reviewer-photo"
                    />
                  ) : (
                    <div className="reviewer-photo-placeholder">
                      {review.authorName.charAt(0)}
                    </div>
                  )}
                  <div className="reviewer-details">
                    <h4 className="reviewer-name">{review.authorName}</h4>
                    <span className="review-time">{review.relativeTimeDescription}</span>
                  </div>
                </div>
                <div className="review-rating">
                  {[...Array(5)].map((_, index) => (
                    <span 
                      key={index} 
                      className={`star ${index < review.rating ? 'filled' : 'empty'}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <p className="review-text">{review.text}</p>
            </div>
          ))}
        </div>

        {reviewsData.reviews.length > 3 && (
          <div className="reviews-actions">
            {displayCount < reviewsData.reviews.length ? (
              <button className="show-more-btn" onClick={handleShowMore}>
                Show More Reviews ({reviewsData.reviews.length - displayCount} remaining)
              </button>
            ) : (
              <button className="show-less-btn" onClick={handleShowLess}>
                Show Less Reviews
              </button>
            )}
          </div>
        )}

        <div className="reviews-footer">
          <p className="reviews-disclaimer">
            * Showing 4 and 5-star reviews only. All reviews are verified Google reviews.
          </p>
          <a 
            href="https://www.google.com/search?q=Ullishtja+Agroturizem+write+review" 
            target="_blank" 
            rel="noopener noreferrer"
            className="write-review-btn"
          >
            Write a Review on Google
          </a>
        </div>
      </div>
    </section>
  );
};

export default GoogleReviews; 