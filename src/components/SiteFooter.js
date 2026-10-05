import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import googleReviewsService from '../services/googleReviews';
import googleAdsService from '../services/googleAdsService';
import LanguageSwitcher from './LanguageSwitcher';
import { buildHomeHash, buildLangPath } from './SiteNav';

function SiteFooter({ t, currentLanguage, onLanguageChange }) {
  const [reviewsData, setReviewsData] = useState(null);

  useEffect(() => {
    let isCancelled = false;
    googleReviewsService
      .fetchGoogleReviews()
      .then((data) => {
        if (!isCancelled) setReviewsData(data);
      })
      .catch((error) => console.error('Error loading reviews:', error));
    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          {/* Footer Main Content */}
          <div className="footer-main">
            {/* Company Info */}
            <div className="footer-section footer-company">
              <img src="/images/ullishtja_logo.jpeg" alt="Ullishtja Agroturizem - Albanian Restaurant Footer Logo" className="footer-logo" loading="lazy" width="144" height="72" />
              <p className="footer-description">{t.footer.tagline}</p>
              <div className="footer-rating">
                <div className="rating-stars">
                  {reviewsData ? googleReviewsService.generateStarDisplay(reviewsData.averageRating) : '⭐⭐⭐⭐⭐'}
                </div>
                <span className="rating-text">
                  {reviewsData
                    ? `${googleReviewsService.formatRating(reviewsData.averageRating)} (${reviewsData.totalReviews} ${t.hero.googleReviews})`
                    : t.hero.loadingReviews}
                </span>
              </div>
            </div>

            {/* Contact Information */}
            <div className="footer-section footer-contact">
              <h4 className="footer-title">{t.contact.title}</h4>
              <div className="contact-item">
                <span className="contact-value">Ullishtja Agroturizem, Durres, Albania</span>
              </div>
              <div className="contact-item">
                <a href="tel:+355684090405" className="contact-value contact-link" onClick={() => googleAdsService.trackPhoneCall()}>
                  +355 68 409 0405
                </a>
              </div>
              <div className="contact-item">
                <a href="mailto:hi@ullishtja-agroturizem.com" className="contact-value contact-link" onClick={() => googleAdsService.trackContactForm('email')}>
                  hi@ullishtja-agroturizem.com
                </a>
              </div>
              <div className="contact-item">
                <span className="contact-value">
                  {t.contact.info.hours.text.replace('\n', ' • ')}
                </span>
              </div>
            </div>

            {/* Quick Links */}
            <div className="footer-section footer-links">
              <h4 className="footer-title">{t.footer.quickLinks}</h4>
              <nav className="footer-nav">
                <Link to={buildHomeHash('#home', currentLanguage)} className="footer-link">{t.nav.home}</Link>
                <Link to={buildHomeHash('#about', currentLanguage)} className="footer-link">{t.nav.about}</Link>
                <Link to={buildLangPath('/menu', currentLanguage)} className="footer-link">{t.nav.menu}</Link>
                <Link to={buildHomeHash('#contact', currentLanguage)} className="footer-link">{t.nav.contact}</Link>
                <Link to={buildHomeHash('#faq', currentLanguage)} className="footer-link">{t.faq.title}</Link>
              </nav>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="footer-bottom">
            <div className="footer-copyright">
              <p>{t.footer.copyright}</p>
            </div>
            <div className="footer-links-bottom">
              <LanguageSwitcher
                variant="footer"
                label="full"
                className="footer-lang"
                currentLanguage={currentLanguage}
                onLanguageChange={onLanguageChange}
              />
              <div className="admin-link-container">
                <a href="/admin-login" className="admin-link">Admin</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
