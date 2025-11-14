import React, { useState, useEffect, Suspense, useCallback, useMemo } from 'react';
import './App.css';
import { translations } from './translations';
import MenuService from './services/menuService';
import googleReviewsService from './services/googleReviews';
import googleAdsService from './services/googleAdsService';
import pdfExportService from './services/pdfExportService';
import useScrollOptimization from './hooks/useScrollOptimization';
import useMobileOptimizations from './hooks/useMobileOptimizations';
import { useAnalyticsTracking } from './hooks/useGoogleAnalytics';
import SEOHead from './components/SEOHead';

// Lazy load components for better performance
const MobileMenu = React.lazy(() => import('./components/MobileMenu'));
const GoogleReviews = React.lazy(() => import('./components/GoogleReviews'));
const GooglePhotos = React.lazy(() => import('./components/GooglePhotos'));
// const Gallery = React.lazy(() => import('./components/Gallery')); // Temporarily disabled
  


const MobileLoadingOptimizer = React.lazy(() => import('./components/MobileLoadingOptimizer'));
const AnalyticsTest = React.lazy(() => import('./components/AnalyticsTest'));


//

// Helper function to get language from localStorage or detect browser language
const getInitialLanguage = () => {
  // Use saved preference if available
  const storedLanguage = localStorage.getItem('preferredLanguage');
  if (storedLanguage && ['al', 'en', 'it'].includes(storedLanguage)) {
    return storedLanguage;
  }

  // Quick, offline guess from browser settings as a temporary value
  const browserLang = navigator.language || navigator.languages?.[0];
  if (browserLang) {
    const langCode = browserLang.toLowerCase();
    if (langCode.startsWith('sq') || langCode.startsWith('al')) return 'al';
    if (langCode.startsWith('it')) return 'it';
  }

  // Default to Albanian
  return 'al';
};

// Language selector will handle its own visibility logic

function App() {
  const [currentLanguage, setCurrentLanguage] = useState(getInitialLanguage());
  const analytics = useAnalyticsTracking();

  // Refine language using IP geolocation (first visit only)
  useEffect(() => {
    const saved = localStorage.getItem('preferredLanguage');
    if (saved && ['al', 'en', 'it'].includes(saved)) {
      return;
    }

    let isCancelled = false;
    const abortController = new AbortController();

    const detectLanguageByCountry = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/', { signal: abortController.signal });
        if (!response.ok) throw new Error('Geo IP request failed');
        const data = await response.json();
        const countryCode = (data.country || data.country_code || data.countryCode || '').toUpperCase();

        // Only switch to Albanian based on geo; otherwise keep default Albanian
        if (countryCode === 'AL' && !isCancelled) {
          setCurrentLanguage('al');
          localStorage.setItem('preferredLanguage', 'al');
          analytics.trackLanguageChange('al', 'geo-detect');
        }
      } catch (error) {
        // Silent fallback: keep browser-derived language
      }
    };

    detectLanguageByCountry();
    return () => {
      isCancelled = true;
      abortController.abort();
    };
  }, [analytics]);

  

  // Initialize Google Ads conversion tracking
  useEffect(() => {
    googleAdsService.initialize();
  }, []);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Initialize scroll optimization
  useScrollOptimization();
  
  // Initialize mobile optimizations
  const { preventBodyScroll, enableBodyScroll } = useMobileOptimizations();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Dynamic menu state
  const [menuCategories, setMenuCategories] = useState([]);
  
  // Google Reviews state
  const [reviewsData, setReviewsData] = useState(null);
  
  // Reservation form temporarily disabled; remove related state to avoid unused warnings
  
  // Memoize translations to avoid recalculating on every render
  const t = useMemo(() => translations[currentLanguage], [currentLanguage]);

  // Removed localization helpers (unused)

  // Handle directions click with conversion tracking
  const handleDirectionsClick = useCallback(() => {
    googleAdsService.trackGetDirections();
  }, []);

  // Handle phone call click with conversion tracking
  const handlePhoneClick = useCallback(() => {
    googleAdsService.trackPhoneCall();
  }, []);

  // Handle email click with conversion tracking
  const handleEmailClick = useCallback(() => {
    googleAdsService.trackContactForm('email');
  }, []);

  // Cleanup effect for modal state
  useEffect(() => {
    return () => {
      // Cleanup: ensure modal-open class is removed on unmount
      document.body.classList.remove('modal-open');
      enableBodyScroll();
    };
  }, [enableBodyScroll]);

  // Load dynamic menu data
  useEffect(() => {
    const loadMenu = async () => {
      try {
        const response = await MenuService.getCompleteMenu();

        if (response && response.success) {
          const categories = response.data || [];
          setMenuCategories(Array.isArray(categories) ? categories : []);
        } else {
          console.error('Failed to load menu:', response?.error || 'Unknown error');
          setMenuCategories([]);
        }
      } catch (error) {
        console.error('Error loading menu:', error);
        setMenuCategories([]);
      }
    };

    loadMenu();
  }, []);

  // Load Google Reviews data
  useEffect(() => {
    const loadReviews = async () => {
      try {
        const data = await googleReviewsService.fetchGoogleReviews();
        setReviewsData(data);
      } catch (error) {
        console.error('Error loading reviews:', error);
      }
    };

    loadReviews();
  }, []);

  // Memoize event handlers with useCallback
  const toggleMobileMenu = useCallback(() => {
    const newState = !mobileMenuOpen;
    setMobileMenuOpen(newState);
    
    // Prevent body scroll when menu is open
    if (newState) {
      preventBodyScroll();
    } else {
      enableBodyScroll();
    }
  }, [mobileMenuOpen, preventBodyScroll, enableBodyScroll]);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
    enableBodyScroll();
  }, [enableBodyScroll]);

  const changeLanguage = useCallback((lang) => {
    const previousLanguage = currentLanguage;
    setCurrentLanguage(lang);
    closeMobileMenu(); // Close mobile menu when language changes
    
    // Store language preference in localStorage
    localStorage.setItem('preferredLanguage', lang);
    
    // Track language change
    if (previousLanguage !== lang) {
      analytics.trackLanguageChange(lang, previousLanguage);
    }
  }, [closeMobileMenu, currentLanguage, analytics]);



  // Reservation form handlers removed while form is disabled

  // Fetch available time slots for a specific date
  // Removed time slot fetcher to avoid unused warnings

  const openNewMobileMenu = useCallback(() => {
    setShowMobileMenu(true);
    // Track menu view
    analytics.trackMenuView(currentLanguage, 'full-menu');
  }, [currentLanguage, analytics]);

  const closeNewMobileMenu = useCallback(() => {
    setShowMobileMenu(false);
  }, []);

  const handlePDFExport = useCallback(async () => {
    
    
    try {
      // Check if we have menu data
      const menuDataForPDF = menuCategories.length > 0 ? menuCategories : [];
      
          // Track PDF download attempt
    analytics.trackPDFDownload(currentLanguage, menuDataForPDF.length);

    // Track Google Ads conversion for menu download
    googleAdsService.trackMenuDownload(currentLanguage);

    // Generate and open/download PDF
    await pdfExportService.openPDFInNewWindow(menuDataForPDF, currentLanguage);
      
    } catch (error) {
      console.error('Error exporting PDF:', error);
      console.error('Error stack:', error.stack);
      
      // Show user-friendly error message
      const isMobile = window.innerWidth <= 768;
      const errorMessage = currentLanguage === 'al' 
        ? 'Gabim gjatë krijimit të PDF-së. Provoni përsëri.' 
        : currentLanguage === 'en' 
        ? 'Error creating PDF. Please try again.' 
        : 'Errore durante la creazione del PDF. Riprovare.';
      
      if (isMobile) {
        // Create mobile-friendly error notification
        const errorElement = document.createElement('div');
        errorElement.style.cssText = `
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: #f44336;
          color: white;
          padding: 12px 24px;
          border-radius: 25px;
          font-size: 14px;
          font-weight: 600;
          z-index: 10000;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        errorElement.textContent = errorMessage;
        document.body.appendChild(errorElement);
        
        // Remove error notification after delay
        setTimeout(() => {
          if (errorElement.parentNode) {
            errorElement.parentNode.removeChild(errorElement);
          }
        }, 4000);
      } else {
        // Desktop: use alert as fallback
        alert(errorMessage);
      }
    }
  }, [menuCategories, currentLanguage, analytics]);

  // Reservation submission removed while form is disabled

  // Memoize complex computations
  // Removed formatted time slots memo

  // Memoize review display components
  const reviewsDisplay = useMemo(() => {
    if (!reviewsData) return { stars: '⭐⭐⭐⭐⭐', rating: '0.0', count: '0' };
    
    return {
      stars: googleReviewsService.generateStarDisplay(reviewsData.averageRating),
      rating: googleReviewsService.formatRating(reviewsData.averageRating),
      count: reviewsData.totalReviews
    };
  }, [reviewsData]);

  // Memoize minimum date for date input
  // Removed minDate memo (unused)

  return (
    <div className="App">
      {/* SEO Head Component */}
      <SEOHead 
        currentLanguage={currentLanguage}
        pageSection="home"
      />
      
      {/* Mobile Loading Optimizer */}
      <Suspense fallback={null}>
        <MobileLoadingOptimizer />
      </Suspense>
      
      {/* Navigation Header */}
      <header className="navbar">
        <div className="nav-container">
          <div className="logo-container">
            <img
              src="/images/ullishtja_logo.jpeg"
              alt="Ullishtja Agroturizem - Authentic Albanian Restaurant Logo"
              className="logo"
              fetchPriority="high"
              decoding="sync"
            />
          </div>
          
          {/* Desktop Navigation */}
          <nav className="nav-menu desktop-nav">
            <a href="#home" className="nav-link" onClick={closeMobileMenu}>{t.nav.home}</a>
            <a href="#about" className="nav-link" onClick={closeMobileMenu}>{t.nav.about}</a>
            <a href="#alacarte" className="nav-link" onClick={closeMobileMenu}>{t.nav.menu}</a>
            <a href={`/blog${currentLanguage !== 'al' ? '?lang=' + currentLanguage : ''}`} className="nav-link" onClick={closeMobileMenu}>{t.nav.blog}</a>
            {/* <a href="#gallery" className="nav-link" onClick={closeMobileMenu}>{t.nav.gallery}</a> */}
            <a href="#contact" className="nav-link" onClick={closeMobileMenu}>{t.nav.contact}</a>
          </nav>

          {/* Mobile Navigation */}
          <div className={`mobile-nav ${mobileMenuOpen ? 'active' : ''}`}>
            <div className="mobile-nav-header">
              <img
                src="/images/ullishtja_logo.jpeg"
                alt="Ullishtja Agroturizem - Albanian Restaurant Mobile Logo"
                className="mobile-logo"
                fetchPriority="high"
                decoding="sync"
                width="120"
                height="60"
              />
              <button className="mobile-close-btn" onClick={closeMobileMenu}>×</button>
            </div>
            <nav className="mobile-nav-menu">
            <a href="#home" className="mobile-nav-link" onClick={closeMobileMenu}>{t.nav.home}</a>
            <a href="#about" className="mobile-nav-link" onClick={closeMobileMenu}>{t.nav.about}</a>
            <a href="#alacarte" className="mobile-nav-link" onClick={closeMobileMenu}>{t.nav.menu}</a>
            <a href={`/blog${currentLanguage !== 'al' ? '?lang=' + currentLanguage : ''}`} className="mobile-nav-link" onClick={closeMobileMenu}>{t.nav.blog}</a>
            {/* <a href="#gallery" className="mobile-nav-link" onClick={closeMobileMenu}>{t.nav.gallery}</a> */}
            <a href="#contact" className="mobile-nav-link" onClick={closeMobileMenu}>{t.nav.contact}</a>
            </nav>

          </div>

          {/* Mobile Menu Overlay */}
          {mobileMenuOpen && <div className="mobile-overlay" onClick={closeMobileMenu}></div>}
          


          {/* Hamburger Menu Button */}
          <button className="hamburger-btn" onClick={toggleMobileMenu} aria-label="Toggle mobile menu">
            <span className={`hamburger-line ${mobileMenuOpen ? 'active' : ''}`}></span>
            <span className={`hamburger-line ${mobileMenuOpen ? 'active' : ''}`}></span>
            <span className={`hamburger-line ${mobileMenuOpen ? 'active' : ''}`}></span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section
        id="home"
        className="hero"
        style={{
          backgroundImage: "url('/images/posters/hero-poster-mobile.png?v=20251114')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Animated Background */}
        <div className="hero-background">
          <div className="hero-bg-image"></div>
          <div className="hero-overlay"></div>
          <div className="floating-elements">
            <div className="floating-element olive">🫒</div>
            <div className="floating-element food">🍽️</div>
            <div className="floating-element mountain">🏔️</div>
            <div className="floating-element wine">🍷</div>
            <div className="floating-element leaf">🌿</div>
          </div>
        </div>

        <div className="hero-container">
          <div className="hero-content">
            {/* <div className="hero-badge">
              <span className="badge-icon">⭐</span>
              <span className="badge-text">{t.hero.badge}</span>
              <span className="badge-icon">⭐</span>
            </div> */}
            
            <h1 className="hero-title">
              <span className="title-line title-main">{t.hero.title}</span>
            </h1>

            <p className="hero-description">
              {t.hero.description}
            </p>

            <div className="hero-actions">
              <a href="#contact" className="cta-button primary" onClick={closeMobileMenu}>
                <span className="btn-text">{t.hero.cta}</span>
                <span className="btn-arrow">→</span>
              </a>
              <a href="#alacarte" className="cta-button secondary" onClick={closeMobileMenu}>
                <span className="btn-text">{t.hero.viewMenu}</span>
              </a>
              <a href="#contact" className="cta-button secondary" onClick={closeMobileMenu}>
                <span className="btn-text">{t.footer.directions}</span>
              </a>
              
                {/* Compact language selector below "Shiko Menunë" on small screens */}
                <div className="lang-switcher-compact">
                  <button
                    type="button"
                    className={`lang-circle-btn ${currentLanguage === 'al' ? 'active' : ''}`}
                    onClick={() => changeLanguage('al')}
                    aria-label="Switch language to Albanian"
                  >
                    Albanian
                  </button>
                  <button
                    type="button"
                    className={`lang-circle-btn ${currentLanguage === 'en' ? 'active' : ''}`}
                    onClick={() => changeLanguage('en')}
                    aria-label="Switch language to English"
                  >
                    English
                  </button>
                  <button
                    type="button"
                    className={`lang-circle-btn ${currentLanguage === 'it' ? 'active' : ''}`}
                    onClick={() => changeLanguage('it')}
                    aria-label="Switch language to Italian"
                  >
                    Italian
                  </button>
                </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-image-container">
              <div className="hero-main-image">
                <Suspense>
                  <picture>
                    {/* Mobile-first source */}
                    <source
                      srcSet="/images/posters/hero-poster-mobile.png"
                      media="(max-width: 600px)"
                    />
                    {/* Default JPG */}
                    <img
                      src="/images/posters/hero-poster.jpg"
                      alt="Ullishtja Agroturizem Restaurant showcasing authentic Albanian cuisine with stunning panoramic mountain views"
                      className="main-img"
                      loading="eager"
                      decoding="async"
                      fetchpriority="high"
                    />
                  </picture>
                </Suspense>
                <div className="image-decoration decoration-1"></div>
                <div className="image-decoration decoration-2"></div>
              </div>
              
              <div className="floating-card">
                <div className="card-content">
                  <div className="card-icon">🍽️</div>
                  <div className="card-text">
                    <div className="card-title">{t.hero.openDaily}</div>
                    <div className="card-subtitle">11:00 - 22:00</div>
                  </div>
                </div>
              </div>

              <div className="floating-rating">
                <div className="rating-stars">
                  {reviewsDisplay.stars}
                </div>
                <div className="rating-text">
                  {reviewsData ? (
                    <>
                      <div className="rating-number">{reviewsDisplay.rating}</div>
                      <div className="rating-count">{reviewsDisplay.count} {t.hero.googleReviews}</div>
                    </>
                  ) : (
                    t.hero.loadingReviews
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>



      {/* About Section */}
      <section id="about" className="about">
        <div className="container">
          <div className="about-content">
            <div className="about-text">
              <h2 id="about-heading">{t.about.title}</h2>
              <p>
                {t.about.text1}
              </p>
              <p>
                {t.about.text2}
              </p>

            </div>
          </div>
        </div>
      </section>



      {/* Events Section */}
      <section id="events" className="events-section">
        <div className="container">
          <div className="section-content">
            <h2 id="events-heading">{t.events.title}</h2>
            <h3 className="section-subtitle">{t.events.subtitle}</h3>
            <p className="section-text">
              {t.events.text1}
            </p>
            <p className="section-text">
              {t.events.text2}
            </p>
            {/* <div className="features-list">
              <div className="feature-item">
                <span className="feature-icon">💒</span>
                <span className="feature-text">{t.events.features.weddings}</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🏢</span>
                <span className="feature-text">{t.events.features.corporate}</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🎉</span>
                <span className="feature-text">{t.events.features.family}</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">👥</span>
                <span className="feature-text">{t.events.features.capacity}</span>
              </div>
            </div> */}
          </div>
        </div>
        <div className="section-image section-image-breakout">
          <Suspense>
            <img
              src="/images/posters/events-poster.jpg"
              alt="Beautiful wedding and events venue at Ullishtja Agroturizem - Perfect for celebrations up to 120 guests with stunning Albanian mountain backdrop"
              className="section-img"
              loading="lazy"
              decoding="async"
              fetchpriority="low"
            />
          </Suspense>
          <div className="image-overlay">
            <div className="overlay-content">
              <span className="overlay-icon">🎊</span>
              <span className="overlay-text">Special Events</span>
            </div>
          </div>
        </div>
      </section>

      {/* A la Carte Section */}
      <section id="alacarte" className="alacarte-section">
        <div className="container">
          <div className="section-grid reverse">
            <div className="section-image">
              <Suspense>
                <img
                  src="/images/posters/alacarte-poster.jpg"
                  alt="Authentic Albanian a la carte cuisine featuring traditional recipes, fresh farm ingredients, and seasonal specialties at Ullishtja Agroturizem"
                  className="section-img"
                  loading="lazy"
                  decoding="async"
                  fetchpriority="low"
                />
              </Suspense>
              <div className="image-overlay">
                <div className="overlay-content">
                  <span className="overlay-icon">🍽️</span>
                  <span className="overlay-text">A la Carte</span>
                </div>
              </div>
            </div>
            <div className="section-content">
              <h2 id="alacarte-heading">{t.alacarte.title}</h2>
              <h3 className="section-subtitle">{t.alacarte.subtitle}</h3>
              <p className="section-text">
                {t.alacarte.text1}
              </p>
              <p className="section-text">
                {t.alacarte.text2}
              </p>
              {/* <div className="features-list">
                <div className="feature-item">
                  <span className="feature-icon">🌱</span>
                  <span className="feature-text">{t.alacarte.features.fresh}</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">📜</span>
                  <span className="feature-text">{t.alacarte.features.traditional}</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🍂</span>
                  <span className="feature-text">{t.alacarte.features.seasonal}</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🍷</span>
                  <span className="feature-text">{t.alacarte.features.wine}</span>
                </div>
              </div> */}

              {/* Moved CTAs here: show green on desktop/tablet, orange on mobile */}
              <div className="menu-cta-container alacarte-cta">
                <button className="mobile-menu-btn show-desktop-tablet" onClick={openNewMobileMenu}>
                  {currentLanguage === 'al'
                    ? 'Shiko Menunë A La Carte'
                    : currentLanguage === 'en'
                    ? 'Menu'
                    : 'Menu'}
                </button>
                <button className="mobile-menu-btn show-mobile" onClick={openNewMobileMenu}>
                  {currentLanguage === 'al'
                    ? 'Shiko Menunë A La Carte'
                    : currentLanguage === 'en'
                    ? 'Menu'
                    : 'Menu'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      

      {/* Gallery Section - Temporarily Disabled */}
      {/* <Suspense fallback={<div className="loading-section">Loading gallery...</div>}>
        <Gallery currentLanguage={currentLanguage} translations={t} />
      </Suspense> */}

      {/* Google Reviews Section */}
      <Suspense fallback={<div className="loading-section">Loading reviews...</div>}>
        <GoogleReviews currentLanguage={currentLanguage} translations={t} />
      </Suspense>

      {/* Customer Photos Section */}
      <Suspense fallback={<div className="loading-section">Loading photos...</div>}>
        <GooglePhotos currentLanguage={currentLanguage} translations={t} />
      </Suspense>

      {/* Contact Section */}
      <section id="contact" className="contact">
        <div className="container">
          <h2 id="contact-heading">{t.contact.title}</h2>
          <div className="contact-grid">
            <div className="contact-info">
              {/* <h3>{t.contact.info.title}</h3> */}
              
              <div className="contact-items-container">
                {/* Interactive Map */}
                <div className="contact-item">
                  <h4>{t.contact.info.address.title}</h4>
                  <div className="map-container">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2995.456!2d19.4335694!3d41.3402778!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDHCsDIwJzI1LjAiTiAxOcKwMjYnMDEuMCJF!5e0!3m2!1sen!2s!4v1699000000000!5m2!1sen!2s"
                      width="100%"
                      height="300"
                      style={{ border: 0, borderRadius: '15px' }}
                      allowFullScreen=""
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Ullishtja Agroturizem Location Map - Authentic Albanian Restaurant in Durres, Albania - Directions and Contact"
                    ></iframe>
                  </div>
                  <p className="address-text">
                    Ullishtja Agroturizem<br />
                    Durres, Albania
                  </p>
                  <div className="directions-container">
                    <a 
                      href="https://maps.google.com/?q=41.340278,19.433569+(Ullishtja+Agroturizem)" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="directions-link google-maps"
                      onClick={handleDirectionsClick}
                    >
                      🗺️ Google Maps
                    </a>
                    <a 
                      href="http://maps.apple.com/?daddr=41.340278,19.433569&q=Ullishtja+Agroturizem" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="directions-link apple-maps"
                    >
                      🍎 Apple Maps
                    </a>
                  </div>
                </div>
                
                <div className="contact-item">
                  <h4>{t.contact.info.phone.title}</h4>
                  <p>
                                    <a href="tel:+35568409405" className="contact-email-link" onClick={handlePhoneClick}>
                  {t.contact.info.phone.text}
                </a>
                  </p>
                </div>
                <div className="contact-item">
                  <h4>{t.contact.info.email.title}</h4>
                  <p>
                                    <a href="mailto:hi@ullishtja-agroturizem.com" className="contact-email-link" onClick={handleEmailClick}>
                  {t.contact.info.email.text}
                </a>
                  </p>
                </div>
                <div className="contact-item">
                  <h4>{t.contact.info.hours.title}</h4>
                  <p>
                    <span className="contact-email-link">
                      {t.contact.info.hours.text.split('\n').map((line, index) => (
                        <span key={index}>
                          {line}
                          {index < t.contact.info.hours.text.split('\n').length - 1 && <br />}
                        </span>
                      ))}
                    </span>
                  </p>
                </div>
              </div>
            </div>
            {/* Reservation Form - Temporarily Disabled */}
            {/* <div className="reservation-form">
              <h3>{t.contact.reservation.title}</h3>
              
              {reservationStatus.loading && (
                <div className="status-message loading">
                  <span className="spinner">⏳</span> {t.contact.reservation.processing}
                </div>
              )}
              
              {reservationStatus.success && (
                <div className="status-message success">
                  <span className="icon">✅</span> {reservationStatus.message}
                </div>
              )}
              
              {reservationStatus.error && (
                <div className="status-message error">
                  <span className="icon">❌</span> {reservationStatus.error}
                </div>
              )}

              <form onSubmit={handleReservationSubmit}>
                <div className="form-field">
                  <label className="form-label">
                    <span className="label-icon">👤</span>
                    {t.contact.reservation.name}
                  </label>
                  <input 
                    type="text" 
                    name="name"
                    placeholder={t.contact.reservation.name} 
                    required 
                    disabled={reservationStatus.loading}
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">
                    <span className="label-icon">📧</span>
                    {t.contact.reservation.email}
                  </label>
                  <input 
                    type="email" 
                    name="email"
                    placeholder={t.contact.reservation.email} 
                    required 
                    disabled={reservationStatus.loading}
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">
                    <span className="label-icon">📞</span>
                    {t.contact.reservation.phone}
                  </label>
                  <input 
                    type="tel" 
                    name="phone"
                    placeholder={t.contact.reservation.phone} 
                    required 
                    disabled={reservationStatus.loading}
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">
                    <span className="label-icon">📅</span>
                    Date
                  </label>
                  <input 
                    type="date" 
                    name="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    required 
                    min={minDate}
                    disabled={reservationStatus.loading}
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">
                    <span className="label-icon">🕐</span>
                    Time
                  </label>
                  {loadingTimeSlots ? (
                    <div className="loading-slots">Loading available times...</div>
                  ) : !selectedDate ? (
                    <div className="select-date-first">Please select a date first</div>
                  ) : availableTimeSlots.length === 0 ? (
                    <div className="no-slots">No available time slots for this date</div>
                  ) : (
                    <select 
                      name="time"
                      required 
                      disabled={reservationStatus.loading}
                    >
                      <option value="">Select time</option>
                      {formattedTimeSlots.map(slot => {
                        return (
                          <option key={slot.id} value={slot.time}>
                            {slot.displayTime} (Available: {slot.availableCapacity} guests)
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>

                <div className="form-field">
                  <label className="form-label">
                    <span className="label-icon">👥</span>
                    {t.contact.reservation.guests}
                  </label>
                  <select 
                    name="guests" 
                    required 
                    disabled={reservationStatus.loading}
                    onChange={handleGuestCountChange}
                    value={selectedGuests === 9 ? '9+' : selectedGuests}
                  >
                    <option value="">{t.contact.reservation.guests}</option>
                    <option value="1">1 {t.contact.reservation.guest}</option>
                    <option value="2">2 {t.contact.reservation.guests_plural}</option>
                    <option value="3">3 {t.contact.reservation.guests_plural}</option>
                    <option value="4">4 {t.contact.reservation.guests_plural}</option>
                    <option value="5">5 {t.contact.reservation.guests_plural}</option>
                    <option value="6">6 {t.contact.reservation.guests_plural}</option>
                    <option value="7">7 {t.contact.reservation.guests_plural}</option>
                    <option value="8">8 {t.contact.reservation.guests_plural}</option>
                    <option value="9+">9+ {t.contact.reservation.guests_plural}</option>
                  </select>
                  {isLargeGroup && (
                    <div className="large-group-notice">
                      <div className="notice-content">
                        <span className="notice-icon">📞</span>
                        <div className="notice-text">
                          <strong>Large Group Reservation</strong>
                          <p>For groups of 9+ guests, please contact us directly for special arrangements:</p>
                          <a href="tel:+35568409405" className="contact-link" onClick={handlePhoneClick}>📞 +355 68 409 0405</a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-field">
                  <label className="form-label">
                    <span className="label-icon">📝</span>
                    {t.contact.reservation.requests}
                  </label>
                  <textarea 
                    name="requests"
                    placeholder={t.contact.reservation.requests}
                    disabled={reservationStatus.loading}
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={reservationStatus.loading}
                >
                  {reservationStatus.loading ? t.contact.reservation.processing : t.contact.reservation.submit}
                </button>
              </form>
            </div> */}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            {/* Footer Main Content */}
            <div className="footer-main">
              {/* Company Info */}
              <div className="footer-section footer-company">
                <img src="/images/ullishtja_logo.jpeg" alt="Ullishtja Agroturizem - Albanian Restaurant Footer Logo" className="footer-logo" loading="lazy" width="120" height="60" />
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
                  <a href="tel:+35568409405" className="contact-value contact-link" onClick={handlePhoneClick}>
                    +355 68 409 0405
                  </a>
                </div>
                <div className="contact-item">
                  <span className="contact-icon">📧</span>
                  <a href="mailto:hi@ullishtja-agroturizem.com" className="contact-value contact-link" onClick={handleEmailClick}>
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
                  <a href="#home" className="footer-link" onClick={closeMobileMenu}>{t.nav.home}</a>
                  <a href="#about" className="footer-link" onClick={closeMobileMenu}>{t.nav.about}</a>
          <a href="#alacarte" className="footer-link" onClick={closeMobileMenu}>{t.nav.menu}</a>
                  <a href={`/blog${currentLanguage !== 'al' ? '?lang=' + currentLanguage : ''}`} className="footer-link" onClick={closeMobileMenu}>{t.nav.blog}</a>
                  {/* <a href="#gallery" className="footer-link" onClick={closeMobileMenu}>{t.nav.gallery}</a> */}
                  <a href="#contact" className="footer-link" onClick={closeMobileMenu}>{t.nav.contact}</a>
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
                <a href="tel:+35568409405" className="footer-phone-link" onClick={handlePhoneClick}>
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



      {/* Mobile Menu */}
      {showMobileMenu && (
        <Suspense fallback={
          <div className="mobile-menu-overlay">
            <div className="mobile-menu-container">
              <div className="mobile-menu-loading">
                <div className="loading-spinner"></div>
                <p>
                  {currentLanguage === 'al' && 'Po ngarkohet menuja...'}
                  {currentLanguage === 'en' && 'Loading menu...'}
                  {currentLanguage === 'it' && 'Caricamento menu...'}
                </p>
              </div>
            </div>
          </div>
        }>
          <MobileMenu 
            currentLanguage={currentLanguage}
            onClose={closeNewMobileMenu}
          />
        </Suspense>
      )}
      
      

      {/* Analytics Test Component - Development Only */}
      {process.env.NODE_ENV === 'development' && (
        <Suspense fallback={null}>
          <AnalyticsTest />
        </Suspense>
      )}
    </div>
  );
}

export default App;
