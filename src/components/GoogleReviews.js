import React, { useState, useEffect, useMemo } from 'react';
import googleReviewsService from '../services/googleReviews';
import './GoogleReviews.css';

const getRelativeTimeLabel = (review, language = 'en') => {
  if (review.relativeTimeDescription) {
    return review.relativeTimeDescription;
  }

  const date = new Date(review.time);
  if (Number.isNaN(date.getTime())) return review.time;

  const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));

  const labels = {
    en: {
      day: 'day',
      days: 'days',
      week: 'week',
      weeks: 'weeks',
      month: 'month',
      months: 'months',
      year: 'year',
      years: 'years',
      ago: 'ago',
    },
    al: {
      day: 'ditë',
      days: 'ditë',
      week: 'javë',
      weeks: 'javë',
      month: 'muaj',
      months: 'muaj',
      year: 'vit',
      years: 'vite',
      ago: 'më parë',
    },
    it: {
      day: 'giorno',
      days: 'giorni',
      week: 'settimana',
      weeks: 'settimane',
      month: 'mese',
      months: 'mesi',
      year: 'anno',
      years: 'anni',
      ago: 'fa',
    },
  };

  const t = labels[language] || labels.en;

  if (diffDays < 1) return language === 'al' ? 'Sot' : language === 'it' ? 'Oggi' : 'Today';
  if (diffDays === 1) return `1 ${t.day} ${t.ago}`;
  if (diffDays < 7) return `${diffDays} ${t.days} ${t.ago}`;

  const weeks = Math.floor(diffDays / 7);
  if (weeks === 1) return `1 ${t.week} ${t.ago}`;
  if (weeks < 5) return `${weeks} ${t.weeks} ${t.ago}`;

  const months = Math.floor(diffDays / 30);
  if (months === 1) return `1 ${t.month} ${t.ago}`;
  if (months < 12) return `${months} ${t.months} ${t.ago}`;

  const years = Math.floor(diffDays / 365);
  return years === 1 ? `1 ${t.year} ${t.ago}` : `${years} ${t.years} ${t.ago}`;
};

const ReviewCard = ({
  review,
  isExpanded,
  onToggleExpand,
  translations,
  currentLanguage,
  shouldShowExpandButton,
  getTruncatedText,
}) => (
  <article className="review-card">
    <div className="review-card-content">
      <div className="reviewer-avatar">
        {review.authorPhotoUrl ? (
          <img
            src={review.authorPhotoUrl}
            alt={review.authorName}
            className="reviewer-photo"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onLoad={(e) => {
              e.currentTarget.classList.add('loaded');
              if (e.currentTarget.nextSibling) {
                e.currentTarget.nextSibling.style.display = 'none';
              }
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div className="reviewer-photo-placeholder" style={{ display: 'flex' }}>
          {review.authorName.charAt(0).toUpperCase()}
        </div>
      </div>

      <h4 className="reviewer-name">{review.authorName}</h4>
      <span className="review-time">{getRelativeTimeLabel(review, currentLanguage)}</span>

      <div className="review-rating">
        {[...Array(5)].map((_, index) => (
          <span key={index} className="star filled">
            ★
          </span>
        ))}
      </div>

      <div className="review-text-container">
        <p className="review-text">
          {isExpanded ? review.text : getTruncatedText(review.text)}
        </p>
        {shouldShowExpandButton(review.text) && (
          <button
            type="button"
            className="expand-review-btn"
            onClick={() => onToggleExpand(review.id)}
          >
            {isExpanded
              ? translations.googleReviews.showLess || 'Show Less'
              : translations.googleReviews.seeMore || 'See More'}
          </button>
        )}
      </div>

      <img
        src="https://developers.google.com/identity/images/g-logo.png"
        alt="Google"
        className="review-google-logo"
        loading="lazy"
        decoding="async"
        width="20"
        height="20"
      />
    </div>
  </article>
);

const GoogleReviews = ({ currentLanguage, translations }) => {
  const [reviewsData, setReviewsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedReviews, setExpandedReviews] = useState(new Set());
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const data = await googleReviewsService.fetchGoogleReviews();
        const fiveStarSorted = (data.reviews || [])
          .filter((r) => Number(r.rating) === 5)
          .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

        setReviewsData({
          ...data,
          reviews: fiveStarSorted,
        });
      } catch (error) {
        console.error('Error loading reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, []);

  const reviews = reviewsData?.reviews || [];

  const carouselReviews = useMemo(() => {
    if (!reviews.length) return [];
    const minCards = Math.max(8, reviews.length * 2);
    let repeatCount = Math.ceil(minCards / reviews.length);
    if (repeatCount % 2 !== 0) repeatCount += 1;
    return Array.from({ length: repeatCount }, () => reviews).flat();
  }, [reviews]);

  const scrollDuration = Math.max(reviews.length * 6, 24);

  const toggleReviewExpansion = (reviewId) => {
    setExpandedReviews((prev) => {
      const next = new Set(prev);
      if (next.has(reviewId)) {
        next.delete(reviewId);
      } else {
        next.add(reviewId);
      }
      return next;
    });
    setIsPaused(true);
  };

  const isReviewExpanded = (reviewId) => expandedReviews.has(reviewId);

  const shouldShowExpandButton = (text) => text.length > 120;

  const getTruncatedText = (text) => {
    if (text.length <= 120) return text;
    return `${text.substring(0, 120)}...`;
  };

  if (loading) {
    return (
      <div className="reviews-loading">
        <div className="loading-spinner"></div>
        <p>{translations.googleReviews.loadingReviews}</p>
      </div>
    );
  }

  if (!reviewsData || reviews.length === 0) {
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
                  {translations.googleReviews.basedOn} {reviewsData.totalReviews}{' '}
                  {translations.googleReviews.googleReviews}
                </span>
              </div>
            </div>
            <a
              href={googleReviewsService.getReviewsUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="google-link"
            >
              <img
                src="https://developers.google.com/identity/images/g-logo.png"
                alt="Google"
                loading="lazy"
                decoding="async"
                width="20"
                height="20"
              />
              {translations.googleReviews.viewOnGoogle}
            </a>
          </div>
        </div>

        <div
          className="reviews-carousel"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocus={() => setIsPaused(true)}
          onBlur={() => setIsPaused(false)}
        >
          <div className="reviews-carousel-fade reviews-carousel-fade-left" aria-hidden="true" />
          <div className="reviews-carousel-fade reviews-carousel-fade-right" aria-hidden="true" />

          <div className="reviews-carousel-viewport">
            <div
              className={`reviews-carousel-track${isPaused ? ' paused' : ''}`}
              style={{ '--scroll-duration': `${scrollDuration}s` }}
            >
              {carouselReviews.map((review, index) => (
                <ReviewCard
                  key={`${review.id}-${index}`}
                  review={review}
                  isExpanded={isReviewExpanded(review.id)}
                  onToggleExpand={toggleReviewExpansion}
                  translations={translations}
                  currentLanguage={currentLanguage}
                  shouldShowExpandButton={shouldShowExpandButton}
                  getTruncatedText={getTruncatedText}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GoogleReviews;
