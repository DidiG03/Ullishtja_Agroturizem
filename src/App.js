import React, { useState, useEffect } from 'react';
import './App.css';
import { translations } from './translations';
import DynamicMenu from './components/DynamicMenu';
import GoogleReviews from './components/GoogleReviews';
import MenuService from './services/menuService';
import googleReviewsService from './services/googleReviews';
import pdfExportService from './services/pdfExportService';
import { handleReservation, validateReservationForm } from './reservationService';

function App() {
  const [currentLanguage, setCurrentLanguage] = useState('al');
  const [showFullMenu, setShowFullMenu] = useState(false);

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
  
  const t = translations[currentLanguage];

  // Add localization helpers
  const getLocalizedName = (item, field = 'name') => {
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
  };

  const getLocalizedText = (item, field) => {
    const text = getLocalizedName(item, field);
    return text || '';
  };

  // Load dynamic menu data
  useEffect(() => {
    const loadMenu = async () => {
      try {
        const response = await MenuService.getCompleteMenu();
        if (response.success) {
          setMenuCategories(response.data || []);
        } else {
          console.error('Failed to load menu:', response.error);
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



  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const changeLanguage = (lang) => {
    setCurrentLanguage(lang);
    closeMobileMenu(); // Close mobile menu when language changes
  };

  const handleGuestCountChange = (e) => {
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
  };

  // Fetch available time slots for a specific date
  const fetchAvailableTimeSlots = async (date) => {
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
  };

  const handleDateChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    fetchAvailableTimeSlots(date);
  };

  const openFullMenu = () => {
    setShowFullMenu(true);
  };

  const closeFullMenu = () => {
    setShowFullMenu(false);
  };

  const handlePDFExport = async () => {
    try {
      // Use the dynamic menu data if available, otherwise fallback to static menu
      const menuDataForPDF = menuCategories.length > 0 ? menuCategories : [];
      
      // Open PDF in new window
      await pdfExportService.openPDFInNewWindow(menuDataForPDF, currentLanguage);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert(currentLanguage === 'al' ? 'Gabim gjatë eksportimit të PDF-së' : 
            currentLanguage === 'en' ? 'Error exporting PDF' : 
            'Errore durante l\'esportazione PDF');
    }
  };

  const handleReservationSubmit = async (e) => {
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
        e.target.reset(); // Clear form
        setSelectedDate('');
        setAvailableTimeSlots([]);
        setSelectedGuests(1);
        setIsLargeGroup(false);
      } else {
        setReservationStatus({
          loading: false,
          success: false,
          error: t.contact.reservation.error,
          message: ''
        });
      }
    } catch (error) {
      setReservationStatus({
        loading: false,
        success: false,
        error: t.contact.reservation.error,
        message: ''
      });
    }
  };

  return (
    <div className="App">
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
                <img 
                  src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80" 
                  alt="Ullishtja Restaurant Interior"
                  className="main-img"
                />
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
                  {reviewsData ? googleReviewsService.generateStarDisplay(reviewsData.averageRating) : '⭐⭐⭐⭐⭐'}
                </div>
                <div className="rating-text">
                  {reviewsData ? (
                    <>
                      <div className="rating-number">{googleReviewsService.formatRating(reviewsData.averageRating)}</div>
                      <div className="rating-count">{reviewsData.totalReviews} {t.hero.googleReviews}</div>
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
              <img 
                src="https://images.unsplash.com/photo-1519167758481-83f29c8a6c4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80" 
                alt="Events and Celebrations"
                className="section-img"
              />
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
              <img 
                src="https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80" 
                alt="A la Carte Menu"
                className="section-img"
              />
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
                    {(category.menuItems || [])
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

      

      {/* Google Reviews Section */}
      <GoogleReviews currentLanguage={currentLanguage} translations={t} />

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
                    min={new Date().toISOString().split('T')[0]}
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
                      {availableTimeSlots.map(slot => {
                        const [hours, minutes] = slot.time.split(':');
                        const hour = parseInt(hours);
                        const ampm = hour >= 12 ? 'PM' : 'AM';
                        const displayHour = hour % 12 || 12;
                        const displayTime = `${displayHour}:${minutes} ${ampm}`;
                        
                        return (
                          <option key={slot.id} value={slot.time}>
                            {displayTime} (Available: {slot.availableCapacity} guests)
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
        <DynamicMenu 
          currentLanguage={currentLanguage}
          onClose={closeFullMenu}
        />
      )}
    </div>
  );
}

export default App;
