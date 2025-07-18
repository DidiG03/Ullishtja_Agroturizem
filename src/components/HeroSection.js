import React, { memo } from 'react';

const HeroSection = memo(({
  t,
  reviewsDisplay,
  reviewsData,
  openFullMenu,
  mobileMenuOpen,
  toggleMobileMenu,
  currentLanguage,
  changeLanguage
}) => {
  return (
    <>
      {/* Navigation */}
      <nav className="navbar">
        <div className="container">
          <div className="nav-container">
            <div className="logo-container">
              <img src="/images/ullishtja_logo.jpeg" alt="Ullishtja" className="logo" />
            </div>
            
            <div className="desktop-nav">
              <div className="nav-menu">
                <a href="#about" className="nav-link">{t.nav.about}</a>
                <a href="#menu" className="nav-link">{t.nav.menu}</a>
                <a href="#contact" className="nav-link">{t.nav.contact}</a>
              </div>
              
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
            </div>
            
            <button 
              className="hamburger-btn"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              <span className={`hamburger-line ${mobileMenuOpen ? 'active' : ''}`}></span>
              <span className={`hamburger-line ${mobileMenuOpen ? 'active' : ''}`}></span>
              <span className={`hamburger-line ${mobileMenuOpen ? 'active' : ''}`}></span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className={`mobile-nav ${mobileMenuOpen ? 'active' : ''}`}>
        <div className="mobile-nav-header">
          <img src="/images/ullishtja_logo.jpeg" alt="Ullishtja" className="mobile-logo" />
          <button 
            className="mobile-close-btn"
            onClick={toggleMobileMenu}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>
        
        <div className="mobile-nav-menu">
          <a href="#about" className="mobile-nav-link" onClick={toggleMobileMenu}>{t.nav.about}</a>
          <a href="#menu" className="mobile-nav-link" onClick={toggleMobileMenu}>{t.nav.menu}</a>
          <a href="#contact" className="mobile-nav-link" onClick={toggleMobileMenu}>{t.nav.contact}</a>
        </div>
        
        <div className="mobile-language-selector">
          <button 
            className={`mobile-lang-btn ${currentLanguage === 'al' ? 'active' : ''}`}
            onClick={() => changeLanguage('al')}
          >
            Albanian
          </button>
          <button 
            className={`mobile-lang-btn ${currentLanguage === 'en' ? 'active' : ''}`}
            onClick={() => changeLanguage('en')}
          >
            English
          </button>
          <button 
            className={`mobile-lang-btn ${currentLanguage === 'it' ? 'active' : ''}`}
            onClick={() => changeLanguage('it')}
          >
            Italian
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {mobileMenuOpen && <div className="mobile-overlay" onClick={toggleMobileMenu}></div>}

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-background">
          <img src="/images/panorama.jpeg" alt="Ullishtja Panorama" className="hero-bg-image" />
          <div className="hero-overlay"></div>
          
          <div className="floating-elements">
            <div className="floating-element olive">🫒</div>
            <div className="floating-element food">🍽️</div>
            <div className="floating-element mountain">🏔️</div>
            <div className="floating-element wine">🍷</div>
            <div className="floating-element leaf">🌿</div>
          </div>
        </div>
        
        <div className="container">
          <div className="hero-container">
            <div className="hero-content">
              <div className="hero-badge">
                <span className="badge-icon">⭐</span>
                <span className="badge-text">{t.hero.badge}</span>
              </div>
              
              <h1 className="hero-title">
                <span className="title-line">{t.hero.title.line1}</span>
                <span className="title-main">{t.hero.title.main}</span>
                <span className="title-accent">{t.hero.title.accent}</span>
              </h1>
              
              <p className="hero-subtitle">{t.hero.subtitle}</p>
              
              <div className="hero-highlights">
                <div className="highlight-item">
                  <span className="highlight-icon">🏡</span>
                  <span className="highlight-text">{t.hero.highlights.authentic}</span>
                </div>
                <div className="highlight-item">
                  <span className="highlight-icon">🌱</span>
                  <span className="highlight-text">{t.hero.highlights.organic}</span>
                </div>
                <div className="highlight-item">
                  <span className="highlight-icon">🏔️</span>
                  <span className="highlight-text">{t.hero.highlights.location}</span>
                </div>
              </div>
              
              <p className="hero-description">{t.hero.description}</p>
              
              <div className="hero-actions">
                <button className="cta-button primary" onClick={openFullMenu}>
                  {t.hero.buttons.viewMenu} <span className="btn-arrow">→</span>
                </button>
                <a href="#contact" className="cta-button secondary">
                  {t.hero.buttons.reserve} <span className="btn-arrow">→</span>
                </a>
              </div>
              
              <div className="hero-stats">
                <div className="stat-item">
                  <div className="stat-number">25+</div>
                  <div className="stat-label">{t.hero.stats.years}</div>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                  <div className="stat-number">500+</div>
                  <div className="stat-label">{t.hero.stats.guests}</div>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                  <div className="stat-number">100%</div>
                  <div className="stat-label">{t.hero.stats.organic}</div>
                </div>
              </div>
            </div>
            
            <div className="hero-visual">
              <div className="hero-image-container">
                <img src="/images/food.jpeg" alt="Traditional Albanian Food" className="hero-main-image main-img" />
                
                <div className="image-decoration decoration-1">🌿</div>
                <div className="image-decoration decoration-2">🫒</div>
                
                <div className="floating-card">
                  <div className="card-content">
                    <div className="card-icon">👨‍🍳</div>
                    <div className="card-title">{t.hero.card.chef}</div>
                    <div className="card-subtitle">{t.hero.card.experience}</div>
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
              
              <div className="scroll-indicator">
                <span className="scroll-text">{t.hero.scroll}</span>
                <div className="scroll-arrow">↓</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
});

HeroSection.displayName = 'HeroSection';

export default HeroSection; 