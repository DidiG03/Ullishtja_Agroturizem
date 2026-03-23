import React, { useState, useEffect, useMemo } from 'react';
import { translations } from '../translations';
import googleReviewsService from '../services/googleReviews';
import googleAdsService from '../services/googleAdsService';
import '../App.css'; // Import main app styles for navbar and footer

// Helper function to get language from localStorage or detect browser language
const getInitialLanguage = () => {
  // Check if user has a stored preference
  const storedLanguage = localStorage.getItem('preferredLanguage');
  if (storedLanguage && ['al', 'en', 'it'].includes(storedLanguage)) {
    return storedLanguage;
  }

  // Check URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const urlLang = urlParams.get('lang');
  if (urlLang && ['al', 'en', 'it'].includes(urlLang)) {
    localStorage.setItem('preferredLanguage', urlLang);
    return urlLang;
  }

  // If no stored preference, try to detect browser language
  const browserLang = navigator.language || navigator.languages[0];
  if (browserLang) {
    const langCode = browserLang.toLowerCase();
    if (langCode.startsWith('sq') || langCode.startsWith('al')) return 'al'; // Albanian
    if (langCode.startsWith('it')) return 'it'; // Italian
    if (langCode.startsWith('en')) return 'en'; // English
  }

  // Default to Albanian
  return 'al';
};

const Layout = ({ children, currentLanguage: propLanguage }) => {
  const [currentLanguage, setCurrentLanguage] = useState(propLanguage || getInitialLanguage());
  const [reviewsData, setReviewsData] = useState(null);

  const t = useMemo(() => translations[currentLanguage], [currentLanguage]);

  // Effect to sync language changes
  useEffect(() => {
    if (propLanguage && propLanguage !== currentLanguage) {
      setCurrentLanguage(propLanguage);
    }
  }, [propLanguage, currentLanguage]);

  // Effect to load reviews data
  useEffect(() => {
    const loadReviews = async () => {
      try {
        const data = await googleReviewsService.fetchGoogleReviews();
        setReviewsData(data);
      } catch (error) {
        console.error('Failed to load reviews:', error);
      }
    };

    loadReviews();
  }, []);

  // Language change handler
  const changeLanguage = (lang) => {
    setCurrentLanguage(lang);
    localStorage.setItem('preferredLanguage', lang);
    
    // Update URL
    const url = new URL(window.location);
    if (lang !== 'al') {
      url.searchParams.set('lang', lang);
    } else {
      url.searchParams.delete('lang');
    }
    window.history.replaceState({}, '', url);

    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('languageChanged', { 
      detail: { language: lang } 
    }));
  };

  // Handle directions click with conversion tracking
  const handleDirectionsClick = () => {
    googleAdsService.trackGetDirectionsConversion();
  };

  // Memoize review display components
  const reviewsDisplay = useMemo(() => {
    if (!reviewsData) return { stars: '⭐⭐⭐⭐⭐', rating: '0.0', count: '0' };
    
    return {
      stars: googleReviewsService.generateStarDisplay(reviewsData.averageRating),
      rating: googleReviewsService.formatRating(reviewsData.averageRating),
      count: reviewsData.totalReviews
    };
  }, [reviewsData]);

  return (
    <div className="layout">
      {/* Navigation Header */}
      <header className="navbar">
        <div className="nav-container nav-container--logo-only">
          <a href="/" className="logo-container logo-home-link" aria-label={t.nav.home}>
            <img src="https://ucarecdn.com/f2ebac4d-52d3-45f7-997d-3e2dea09557b/ullishtja_logo.jpeg" alt="Ullishtja Agroturizem - Authentic Albanian Restaurant Logo" className="logo" loading="eager" decoding="async" fetchpriority="high" width="100" height="50" />
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {React.cloneElement(children, { currentLanguage, translations: t })}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            {/* Footer Main Content */}
            <div className="footer-main">
              {/* Company Info */}
              <div className="footer-section footer-company">
                <img src="/images/ullishtja_logo.jpeg" alt="Ullishtja Agroturizem - Albanian Restaurant Footer Logo" className="footer-logo" />
                <p className="footer-description">{t.footer.tagline}</p>
                <div className="footer-rating">
                  <div className="rating-stars">
                    {reviewsDisplay.stars}
                  </div>
                  <span className="rating-text">
                    {reviewsData ? `${reviewsDisplay.rating} (${reviewsDisplay.count} ${t.hero.googleReviews})` : t.hero.loadingReviews}
                  </span>
                </div>
              </div>

              {/* Contact Information */}
              <div className="footer-section footer-contact">
                <h4 className="footer-title">{t.contact.title}</h4>
                <div className="contact-item">
                  <span className="contact-icon">📍</span>
                  <span className="contact-value">Ullishtja Agroturizem, Durres, Albania</span>
                </div>
                <div className="contact-item">
                  <span className="contact-icon">📞</span>
                  <a href="tel:+355684090405" className="contact-value contact-link">
                    +355 68 409 0405
                  </a>
                </div>
                <div className="contact-item">
                  <span className="contact-icon">📧</span>
                  <a href="mailto:hi@ullishtja-agroturizem.com" className="contact-value contact-link">
                    hi@ullishtja-agroturizem.com
                  </a>
                </div>
                <div className="contact-item">
                  <span className="contact-icon">🕒</span>
                  <span className="contact-value">
                    {t.contact.info.hours.text.replace('\n', ' • ')}
                  </span>
                </div>
              </div>

              {/* Quick Links */}
              <div className="footer-section footer-links">
                <h4 className="footer-title">{t.footer.quickLinks}</h4>
                <nav className="footer-nav">
                  <a href="/#home" className="footer-link">{t.nav.home}</a>
                  <a href="/#about" className="footer-link">{t.nav.about}</a>
                  <a href="/#alacarte" className="footer-link">{t.nav.menu}</a>
                  <a href={`/blog${currentLanguage !== 'al' ? '?lang=' + currentLanguage : ''}`} className="footer-link">{t.nav.blog}</a>
                  <a href="/#contact" className="footer-link">{t.nav.contact}</a>
                </nav>
              </div>

              {/* Services */}
              <div className="footer-section footer-services">
                <h4 className="footer-title">{t.footer.services}</h4>
                <div className="service-list">
                  <span className="service-item">🍽️ {t.footer.alaCarte}</span>
                  <span className="service-item">🎉 {t.footer.events}</span>
                  <span className="service-item">🌿 {t.footer.organic}</span>
                  <span className="service-item">🏔️ {t.footer.views}</span>
                </div>
              </div>
            </div>

            {/* Footer Bottom */}
            <div className="footer-bottom">
              <div className="footer-copyright">
                <p>{t.footer.copyright}</p>
              </div>
              <div className="footer-links-bottom">
                <a href="https://maps.google.com/?q=41.340278,19.433569+(Ullishtja+Agroturizem)" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="footer-map-link"
                   onClick={handleDirectionsClick}>
                  🗺️ {t.footer.directions}
                </a>
                <a href="tel:+355684090405" className="footer-phone-link">
                  📞 {t.footer.callUs}
                </a>
                <div className="language-selector footer-lang">
                  <button 
                    className={`lang-btn ${currentLanguage === 'al' ? 'active' : ''}`}
                    onClick={() => changeLanguage('al')}
                  >
                    Albanian
                  </button>
                  <button 
                    className={`lang-btn ${currentLanguage === 'en' ? 'active' : ''}`}
                    onClick={() => changeLanguage('en')}
                  >
                    English
                  </button>
                  <button 
                    className={`lang-btn ${currentLanguage === 'it' ? 'active' : ''}`}
                    onClick={() => changeLanguage('it')}
                  >
                    Italian
                  </button>
                </div>
                <div className="admin-link-container">
                  <a href="/admin-login" className="admin-link">Admin</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;