import React, { useState, useEffect, Suspense, useCallback, useMemo } from 'react';
import './App.css';
import { translations } from './translations';
import MenuService from './services/menuService';
import googleReviewsService from './services/googleReviews';
import pdfExportService from './services/pdfExportService';
import { handleReservation, validateReservationForm } from './reservationService';
import useScrollOptimization from './hooks/useScrollOptimization';
import useMobileOptimizations from './hooks/useMobileOptimizations';

// Lazy load components for better performance
const DynamicMenu = React.lazy(() => import('./components/DynamicMenu'));
const GoogleReviews = React.lazy(() => import('./components/GoogleReviews'));
const Gallery = React.lazy(() => import('./components/Gallery'));
const OptimizedVideo = React.lazy(() => import('./components/OptimizedVideo'));

const MobileLoadingOptimizer = React.lazy(() => import('./components/MobileLoadingOptimizer'));

function App() {
  const [currentLanguage, setCurrentLanguage] = useState('al');
  const [showFullMenu, setShowFullMenu] = useState(false);
  
  // Initialize scroll optimization
  useScrollOptimization();
  
  // Initialize mobile optimizations
  const { preventBodyScroll, enableBodyScroll } = useMobileOptimizations();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLargeGroup, setIsLargeGroup] = useState(false);
  const [reservationStatus, setReservationStatus] = useState({
    loading: false,
    success: false,
    error: null,
    message: ''
  });
  
  // Dynamic menu state
  const [menuCategories, setMenuCategories] = useState([]);
  
  // Google Reviews state
  const [reviewsData, setReviewsData] = useState(null);
  
  // Time slots state
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedGuests, setSelectedGuests] = useState(1);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);
  
  // Memoize translations to avoid recalculating on every render
  const t = useMemo(() => translations[currentLanguage], [currentLanguage]);

  // Memoize localization helpers
  const getLocalizedName = useCallback((item, field = 'name') => {
    switch (currentLanguage) {
      case 'al':
        return item[`${field}AL`];
      case 'en':
        return item[`${field}EN`];
      case 'it':
        return item[`${field}IT`];
      default:
        return item[`${field}AL`];
    }
  }, [currentLanguage]);

  const getLocalizedText = useCallback((item, field) => {
    const text = getLocalizedName(item, field);
    return text || '';
  }, [getLocalizedName]);

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
        console.log('Menu API response:', response); // Debug log
        
        if (response && response.success) {
          const categories = response.data || [];
          console.log('Setting menu categories:', categories); // Debug log
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
    setCurrentLanguage(lang);
    closeMobileMenu(); // Close mobile menu when language changes
  }, [closeMobileMenu]);

  const handleGuestCountChange = useCallback((e) => {
    const guestCount = e.target.value;
    setIsLargeGroup(guestCount === '9+');
    setSelectedGuests(guestCount === '9+' ? 9 : parseInt(guestCount));
    
    // Clear any existing reservation status when guest count changes
    if (guestCount === '9+') {
      setReservationStatus({
        loading: false,
        success: false,
        error: null,
        message: ''
      });
    }
  }, []);

  // Fetch available time slots for a specific date
  const fetchAvailableTimeSlots = useCallback(async (date) => {
    if (!date) {
      setAvailableTimeSlots([]);
      return;
    }

    try {
      setLoadingTimeSlots(true);
      const response = await fetch(`/api/timeslots?action=available&date=${date}`);
      const result = await response.json();
      
      if (result.success) {
        setAvailableTimeSlots(result.data);
      } else {
        console.error('Failed to fetch available time slots:', result.error);
        setAvailableTimeSlots([]);
      }
    } catch (error) {
      console.error('Error fetching available time slots:', error);
      setAvailableTimeSlots([]);
    } finally {
      setLoadingTimeSlots(false);
    }
  }, []);

  const handleDateChange = useCallback((e) => {
    const date = e.target.value;
    setSelectedDate(date);
    fetchAvailableTimeSlots(date);
  }, [fetchAvailableTimeSlots]);

  const openFullMenu = useCallback(() => {
    setShowFullMenu(true);
    // Prevent body scrolling when menu is open
    preventBodyScroll();
    // Add CSS class for additional scroll prevention
    document.body.classList.add('modal-open');
    // Scroll to top of the page so modal appears in viewport
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [preventBodyScroll]);

  const closeFullMenu = useCallback(() => {
    setShowFullMenu(false);
    // Re-enable body scrolling when menu is closed
    enableBodyScroll();
    // Remove CSS class
    document.body.classList.remove('modal-open');
  }, [enableBodyScroll]);

  const handlePDFExport = useCallback(async () => {
    console.log('PDF Export button clicked!', { 
      currentLanguage, 
      menuCategoriesLength: menuCategories.length,
      isMobile: window.innerWidth <= 768,
      userAgent: navigator.userAgent 
    });
    
    try {
      // Check if we have menu data
      const menuDataForPDF = menuCategories.length > 0 ? menuCategories : [];
      console.log('Menu data for PDF:', menuDataForPDF);
      
      // Show loading state for user feedback
      const isMobile = window.innerWidth <= 768;
      const loadingMessage = currentLanguage === 'al' 
        ? 'Duke përgatitur PDF-në...' 
        : currentLanguage === 'en' 
        ? 'Preparing PDF...' 
        : 'Preparazione PDF...';
      
      console.log('Creating loading indicator for mobile:', isMobile);
      
      // Create temporary loading indicator
      let loadingElement = null;
      if (isMobile) {
        loadingElement = document.createElement('div');
        loadingElement.style.cssText = `
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: #2196F3;
          color: white;
          padding: 12px 24px;
          border-radius: 25px;
          font-size: 14px;
          font-weight: 600;
          z-index: 10000;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        loadingElement.textContent = loadingMessage;
        document.body.appendChild(loadingElement);
        console.log('Loading indicator added to DOM');
      }
      
      console.log('Calling PDF service...');
      // Generate and open/download PDF
      await pdfExportService.openPDFInNewWindow(menuDataForPDF, currentLanguage);
      console.log('PDF service completed successfully');
      
      // Remove loading indicator
      if (loadingElement && loadingElement.parentNode) {
        loadingElement.parentNode.removeChild(loadingElement);
        console.log('Loading indicator removed');
      }
      
    } catch (error) {
      console.error('Error exporting PDF:', error);
      console.error('Error stack:', error.stack);
      
      // Remove loading indicator on error
      const loadingElement = document.querySelector('[style*="background: #2196F3"]');
      if (loadingElement && loadingElement.parentNode) {
        loadingElement.parentNode.removeChild(loadingElement);
      }
      
      // Show user-friendly error message
      const isMobile = window.innerWidth <= 768;
      const errorMessage = currentLanguage === 'al' 
        ? 'Gabim gjatë krijimit të PDF-së. Provoni përsëri.' 
        : currentLanguage === 'en' 
        ? 'Error creating PDF. Please try again.' 
        : 'Errore durante la creazione del PDF. Riprovare.';
      
      console.log('Showing error message:', errorMessage);
      
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
  }, [menuCategories, currentLanguage]);

  const handleReservationSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    // Check if it's a large group
    if (isLargeGroup) {
      setReservationStatus({
        loading: false,
        success: false,
        error: t.contact.reservation.largeGroupError || 'For groups of 9+ guests, please contact us directly.',
        message: ''
      });
      return;
    }

    setReservationStatus({ loading: true, success: false, error: null, message: '' });

    const formData = new FormData(e.target);
    
    // Validate form
    const validation = validateReservationForm(formData);
    if (!validation.isValid) {
      setReservationStatus({
        loading: false,
        success: false,
        error: validation.errors.join(', '),
        message: ''
      });
      return;
    }

    // Validate time slot capacity
    const date = formData.get('date');
    const time = formData.get('time');
    const guests = parseInt(formData.get('guests'));
    
    try {
      const capacityResponse = await fetch(`/api/timeslots?action=validate&date=${date}&time=${time}&guests=${guests}`);
      const capacityResult = await capacityResponse.json();
      
      if (!capacityResult.isValid) {
        setReservationStatus({
          loading: false,
          success: false,
          error: capacityResult.error || 'Time slot is not available',
          message: ''
        });
        return;
      }
    } catch (error) {
      console.error('Error validating time slot:', error);
      setReservationStatus({
        loading: false,
        success: false,
        error: 'Error validating time slot availability',
        message: ''
      });
      return;
    }

    try {
      // Handle reservation - send email notification to restaurant
      const result = await handleReservation(formData, 'email');
      
      if (result.success) {
        setReservationStatus({
          loading: false,
          success: true,
          error: null,
          message: t.contact.reservation.confirmationMessage
        });

        // Clear form
        e.target.reset(); // Clear form
        setSelectedDate('');
        setAvailableTimeSlots([]);
        setSelectedGuests(1);
        setIsLargeGroup(false);
      } else {
        throw new Error(result.error || 'Reservation failed');
      }
    } catch (error) {
      console.error('Reservation error:', error);
      setReservationStatus({
        loading: false,
        success: false,
        error: error.message || t.contact.reservation.errorMessage,
        message: ''
      });
    }
  }, [isLargeGroup, t.contact.reservation.largeGroupError, t.contact.reservation.confirmationMessage, t.contact.reservation.errorMessage]);

  // Memoize complex computations
  const formattedTimeSlots = useMemo(() => {
    return availableTimeSlots.map(slot => {
      const [hours, minutes] = slot.time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      const displayTime = `${displayHour}:${minutes} ${ampm}`;
      
      return {
        ...slot,
        displayTime
      };
    });
  }, [availableTimeSlots]);

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
  const minDate = useMemo(() => new Date().toISOString().split('T')[0], []);

  return (
    <div className="App">
      {/* Mobile Loading Optimizer */}
      <Suspense fallback={null}>
        <MobileLoadingOptimizer />
      </Suspense>
      
      {/* Navigation Header */}
      <header className="navbar">
        <div className="nav-container">
          <div className="logo-container">
            <img src="https://ucarecdn.com/f2ebac4d-52d3-45f7-997d-3e2dea09557b/ullishtja_logo.jpeg" alt="Ullishtja Agriturizem" className="logo" />
          </div>
          
          {/* Desktop Navigation */}
          <nav className="nav-menu desktop-nav">
            <a href="#home" className="nav-link" onClick={closeMobileMenu}>{t.nav.home}</a>
            <a href="#about" className="nav-link" onClick={closeMobileMenu}>{t.nav.about}</a>
            <a href="#menu" className="nav-link" onClick={closeMobileMenu}>{t.nav.menu}</a>
            <a href="#gallery" className="nav-link" onClick={closeMobileMenu}>{t.nav.gallery}</a>
            <a href="#contact" className="nav-link" onClick={closeMobileMenu}>{t.nav.contact}</a>
          </nav>

          {/* Mobile Navigation */}
          <div className={`mobile-nav ${mobileMenuOpen ? 'active' : ''}`}>
            <div className="mobile-nav-header">
              <img src="https://ucarecdn.com/f2ebac4d-52d3-45f7-997d-3e2dea09557b/ullishtja_logo.jpeg" alt="Ullishtja Agriturizem" className="mobile-logo" />
              <button className="mobile-close-btn" onClick={closeMobileMenu}>×</button>
            </div>
            <nav className="mobile-nav-menu">
                          <a href="#home" className="mobile-nav-link" onClick={closeMobileMenu}>{t.nav.home}</a>
            <a href="#about" className="mobile-nav-link" onClick={closeMobileMenu}>{t.nav.about}</a>
            <a href="#menu" className="mobile-nav-link" onClick={closeMobileMenu}>{t.nav.menu}</a>
            <a href="#gallery" className="mobile-nav-link" onClick={closeMobileMenu}>{t.nav.gallery}</a>
            <a href="#contact" className="mobile-nav-link" onClick={closeMobileMenu}>{t.nav.contact}</a>
            </nav>
            <div className="mobile-language-selector">
              <button 
                className={`mobile-lang-btn ${currentLanguage === 'al' ? 'active' : ''}`}
                onClick={() => changeLanguage('al')}
              >
                AL
              </button>
              <button 
                className={`mobile-lang-btn ${currentLanguage === 'en' ? 'active' : ''}`}
                onClick={() => changeLanguage('en')}
              >
                EN
              </button>
              <button 
                className={`mobile-lang-btn ${currentLanguage === 'it' ? 'active' : ''}`}
                onClick={() => changeLanguage('it')}
              >
                IT
              </button>
            </div>
          </div>

          {/* Mobile Menu Overlay */}
          {mobileMenuOpen && <div className="mobile-overlay" onClick={closeMobileMenu}></div>}
          
          {/* Desktop Language Selector */}
          <div className="language-selector desktop-lang">
            <button 
              className={`lang-btn ${currentLanguage === 'al' ? 'active' : ''}`}
              onClick={() => changeLanguage('al')}
            >
              AL
            </button>
            <button 
              className={`lang-btn ${currentLanguage === 'en' ? 'active' : ''}`}
              onClick={() => changeLanguage('en')}
            >
              EN
            </button>
            <button 
              className={`lang-btn ${currentLanguage === 'it' ? 'active' : ''}`}
              onClick={() => changeLanguage('it')}
            >
              IT
            </button>
          </div>

          {/* Hamburger Menu Button */}
          <button className="hamburger-btn" onClick={toggleMobileMenu} aria-label="Toggle mobile menu">
            <span className={`hamburger-line ${mobileMenuOpen ? 'active' : ''}`}></span>
            <span className={`hamburger-line ${mobileMenuOpen ? 'active' : ''}`}></span>
            <span className={`hamburger-line ${mobileMenuOpen ? 'active' : ''}`}></span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="hero">
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
            <div className="hero-badge">
              <span className="badge-icon">⭐</span>
              <span className="badge-text">{t.hero.badge}</span>
              <span className="badge-icon">⭐</span>
            </div>
            
            <h1 className="hero-title">
              <span className="title-line title-main">{t.hero.title}</span>
            </h1>
            
            <div className="hero-highlights">
              <div className="highlight-item">
                <span className="highlight-icon">🌱</span>
                <span className="highlight-text">{t.hero.highlights.farmFresh}</span>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">👨‍🍳</span>
                <span className="highlight-text">{t.hero.highlights.traditionalRecipes}</span>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">🏔️</span>
                <span className="highlight-text">{t.hero.highlights.mountainViews}</span>
              </div>
            </div>

            <p className="hero-description">
              {t.hero.description}
            </p>

            <div className="hero-actions">
              <a href="#contact" className="cta-button primary" onClick={closeMobileMenu}>
                <span className="btn-icon">📅</span>
                <span className="btn-text">{t.hero.cta}</span>
                <span className="btn-arrow">→</span>
              </a>
              <a href="#menu" className="cta-button secondary" onClick={closeMobileMenu}>
                <span className="btn-icon">🍽️</span>
                <span className="btn-text">{t.hero.viewMenu}</span>
              </a>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-image-container">
              <div className="hero-main-image">
                <Suspense fallback={<img src="/images/panorama.jpeg" alt="Ullishtja Restaurant" className="main-img" />}>
                  <OptimizedVideo
                    src="/images/wetransfer_ullishtja/DJI_20240806130609_0022_D.mov"
                    poster="/images/posters/hero-poster.jpg"
                    fallbackImage="/images/panorama.jpeg"
                    alt="Ullishtja Restaurant"
                    className="main-img"
                    autoPlay={true}
                    muted={true}
                    loop={true}
                    playsInline={true}
                    lazy={true}
                  />
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
              <h2>{t.about.title}</h2>
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
          <div className="section-grid">
            <div className="section-content">
              <h2>{t.events.title}</h2>
              <h3 className="section-subtitle">{t.events.subtitle}</h3>
              <p className="section-text">
                {t.events.text1}
              </p>
              <p className="section-text">
                {t.events.text2}
              </p>
              <div className="features-list">
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
              </div>
            </div>
            <div className="section-image">
              <Suspense fallback={<img src="/images/food.jpeg" alt="Events and Celebrations" className="section-img" />}>
                <OptimizedVideo
                  src="/images/wetransfer_ullishtja/DJI_20240806124740_0003_D.mov"
                  poster="/images/posters/events-poster.jpg"
                  fallbackImage="/images/food.jpeg"
                  alt="Events and Celebrations"
                  className="section-img"
                  autoPlay={true}
                  muted={true}
                  loop={true}
                  playsInline={true}
                  lazy={true}
                />
              </Suspense>
              <div className="image-overlay">
                <div className="overlay-content">
                  <span className="overlay-icon">🎊</span>
                  <span className="overlay-text">Special Events</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* A la Carte Section */}
      <section id="alacarte" className="alacarte-section">
        <div className="container">
          <div className="section-grid reverse">
            <div className="section-image">
              <Suspense fallback={<img src="/images/food.jpeg" alt="A la Carte Menu" className="section-img" />}>
                <OptimizedVideo
                  src="/images/wetransfer_ullishtja/IMG_4999.mov"
                  poster="/images/posters/alacarte-poster.jpg"
                  fallbackImage="/images/food.jpeg"
                  alt="A la Carte Menu"
                  className="section-img"
                  autoPlay={true}
                  muted={true}
                  loop={true}
                  playsInline={true}
                  lazy={true}
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
              <h2>{t.alacarte.title}</h2>
              <h3 className="section-subtitle">{t.alacarte.subtitle}</h3>
              <p className="section-text">
                {t.alacarte.text1}
              </p>
              <p className="section-text">
                {t.alacarte.text2}
              </p>
              <div className="features-list">
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
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Section */}
      <section id="menu" className="menu">
        <div className="container">
          <h2>{t.menu.title}</h2>

          {menuCategories.length === 0 ? (
            ( /* Fallback to translations while menu loads */
              <div className="menu-grid">
                <div className="menu-category">
                  <h3>{t.menu.appetizers.title}</h3>
                  <div className="menu-item">
                    <h4>{t.menu.appetizers.byrek.name}</h4>
                    <p>{t.menu.appetizers.byrek.desc}</p>
                    <span className="price">800 ALL</span>
                  </div>
                  <div className="menu-item">
                    <h4>{t.menu.appetizers.turshi.name}</h4>
                    <p>{t.menu.appetizers.turshi.desc}</p>
                    <span className="price">600 ALL</span>
                  </div>
                  <div className="menu-item">
                    <h4>{t.menu.appetizers.cheese.name}</h4>
                    <p>{t.menu.appetizers.cheese.desc}</p>
                    <span className="price">700 ALL</span>
                  </div>
                </div>

                <div className="menu-category">
                  <h3>{t.menu.mains.title}</h3>
                  <div className="menu-item">
                    <h4>{t.menu.mains.tave.name}</h4>
                    <p>{t.menu.mains.tave.desc}</p>
                    <span className="price">1500 ALL</span>
                  </div>
                  <div className="menu-item">
                    <h4>{t.menu.mains.qofte.name}</h4>
                    <p>{t.menu.mains.qofte.desc}</p>
                    <span className="price">1200 ALL</span>
                  </div>
                  <div className="menu-item">
                    <h4>{t.menu.mains.fish.name}</h4>
                    <p>{t.menu.mains.fish.desc}</p>
                    <span className="price">1800 ALL</span>
                  </div>
                </div>

                <div className="menu-category">
                  <h3>{t.menu.salads.title}</h3>
                  <div className="menu-item">
                    <h4>{t.menu.salads.village.name}</h4>
                    <p>{t.menu.salads.village.desc}</p>
                    <span className="price">800 ALL</span>
                  </div>
                  <div className="menu-item">
                    <h4>{t.menu.salads.olive.name}</h4>
                    <p>{t.menu.salads.olive.desc}</p>
                    <span className="price">900 ALL</span>
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="menu-grid">
              {(Array.isArray(menuCategories) ? menuCategories : [])
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .slice(0, 3) // Show first 3 categories
                .map((category) => (
                  <div key={category.id} className="menu-category">
                    <h3>{getLocalizedName(category)}</h3>
                    {(Array.isArray(category.menuItems) ? category.menuItems : [])
                      .sort((a, b) => a.displayOrder - b.displayOrder)
                      .slice(0, 3) // Show first 3 items per category
                      .map((item) => (
                        <div key={item.id} className="menu-item">
                          <h4>{getLocalizedName(item)}</h4>
                          {getLocalizedText(item, 'description') && (
                            <p>{getLocalizedText(item, 'description')}</p>
                          )}
                          <span className="price">
                            {item.price} {item.currency}
                          </span>
                        </div>
                      ))}
                  </div>
                ))}
            </div>
          )}

          <div className="menu-cta-container">
            <button className="full-menu-btn" onClick={openFullMenu}>
              {t.fullMenu.viewFullMenu}
            </button>
            <button className="pdf-export-btn" onClick={handlePDFExport}>
              <span className="btn-icon">📄</span>
              {currentLanguage === 'al'
                ? 'Shiko PDF'
                : currentLanguage === 'en'
                ? 'View PDF'
                : 'Visualizza PDF'}
            </button>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <Suspense fallback={<div className="loading-section">Loading gallery...</div>}>
        <Gallery currentLanguage={currentLanguage} translations={t} />
      </Suspense>

      {/* Google Reviews Section */}
      <Suspense fallback={<div className="loading-section">Loading reviews...</div>}>
        <GoogleReviews currentLanguage={currentLanguage} translations={t} />
      </Suspense>

      {/* Contact Section */}
      <section id="contact" className="contact">
        <div className="container">
          <h2>{t.contact.title}</h2>
          <div className="contact-grid">
            <div className="contact-info">
              <h3>{t.contact.info.title}</h3>
              
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
                      title="Ullishtja Agroturizem Location - Durres, Albania"
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
                  <p>{t.contact.info.phone.text}</p>
                </div>
                <div className="contact-item">
                  <h4>{t.contact.info.hours.title}</h4>
                  <p>{t.contact.info.hours.text.split('\n').map((line, index) => (
                    <span key={index}>
                      {line}
                      {index < t.contact.info.hours.text.split('\n').length - 1 && <br />}
                    </span>
                  ))}</p>
                </div>
              </div>
            </div>
            <div className="reservation-form">
              <h3>{t.contact.reservation.title}</h3>
              
              {/* Status Messages */}
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
                          <a href="tel:+35568409405" className="contact-link">📞 +355 68 409 0405</a>
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
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <img src="/images/ullishtja_logo.jpeg" alt="Ullishtja" className="footer-logo" />
            <p>{t.footer.copyright}</p>
            <p>{t.footer.tagline}</p>
            <div className="admin-link-container">
              <a href="/admin-login" className="admin-link">Admin</a>
            </div>
          </div>
        </div>
      </footer>

            {/* Full Menu Modal */}
      {showFullMenu && (
        <Suspense fallback={<div className="loading-section">Loading menu...</div>}>
          <DynamicMenu 
            currentLanguage={currentLanguage}
            onClose={closeFullMenu}
          />
        </Suspense>
      )}
    </div>
  );
}

export default App;
