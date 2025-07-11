import React, { useState, useEffect } from 'react';
import googleReviewsService from '../services/googleReviews';
import './GoogleReviews.css';

const GoogleReviews = ({ currentLanguage, translations }) => {
  const [reviewsData, setReviewsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(3);
  const [expandedReviews, setExpandedReviews] = useState(new Set());

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

  const toggleReviewExpansion = (reviewId) => {
    setExpandedReviews(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(reviewId)) {
        newExpanded.delete(reviewId);
      } else {
        newExpanded.add(reviewId);
      }
      return newExpanded;
    });
  };

  const isReviewExpanded = (reviewId) => {
    return expandedReviews.has(reviewId);
  };

  const shouldShowExpandButton = (text) => {
    return text.length > 150; // Show expand button if text is longer than 150 characters
  };

  const getTruncatedText = (text) => {
    if (text.length <= 150) return text;
    return text.substring(0, 150) + '...';
  };

  if (loading) {
    return (
      <div className="reviews-loading">
        <div className="loading-spinner"></div>
        <p>{translations.googleReviews.loadingReviews}</p>
      </div>
    );
  }

  if (!reviewsData || reviewsData.reviews.length === 0) {
    return (
      <div className="reviews-error">
        <p>{translations.googleReviews.unableToLoad}</p>
      </div>
    );
  }

  return (
    <section className="google-reviews-section">
      <div className="container">
        <div className="reviews-header">
          <h2>{translations.googleReviews.title}</h2>
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
                  {translations.googleReviews.basedOn} {reviewsData.totalReviews} {translations.googleReviews.googleReviews}
                </span>
              </div>
            </div>
            <a 
              href={googleReviewsService.getReviewsUrl()} 
              target="_blank" 
              rel="noopener noreferrer"
              className="google-link"
            >
              <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" />
              {translations.googleReviews.viewOnGoogle}
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
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className="reviewer-photo-placeholder"
                    style={{ display: review.authorPhotoUrl ? 'none' : 'flex' }}
                  >
                    {review.authorName.charAt(0).toUpperCase()}
                  </div>
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
              <div className="review-text-container">
                <p className="review-text">
                  {isReviewExpanded(review.id) ? review.text : getTruncatedText(review.text)}
                </p>
                {shouldShowExpandButton(review.text) && (
                  <button 
                    className="expand-review-btn"
                    onClick={() => toggleReviewExpansion(review.id)}
                  >
                    {isReviewExpanded(review.id) ? 
                      (translations.googleReviews.showLess || 'Show Less') : 
                      (translations.googleReviews.seeMore || 'See More')
                    }
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {reviewsData.reviews.length > 3 && (
          <div className="reviews-actions">
            {displayCount < reviewsData.reviews.length ? (
              <button className="show-more-btn" onClick={handleShowMore}>
                {translations.googleReviews.showMoreReviews} ({reviewsData.reviews.length - displayCount} {translations.googleReviews.remaining})
              </button>
            ) : (
              <button className="show-less-btn" onClick={handleShowLess}>
                {translations.googleReviews.showLessReviews}
              </button>
            )}
          </div>
        )}

        <div className="reviews-footer">
          <p className="reviews-disclaimer">
            {translations.googleReviews.disclaimer}
          </p>
          <a 
            href={googleReviewsService.getWriteReviewUrl()} 
            target="_blank" 
            rel="noopener noreferrer"
            className="write-review-btn"
          >
            {translations.googleReviews.writeReview}
          </a>
        </div>
      </div>
    </section>
  );
};

export default GoogleReviews; 