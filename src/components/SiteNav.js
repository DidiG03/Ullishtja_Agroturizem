import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';

function buildBlogPath(lang) {
  return lang === 'al' ? '/blog' : `/blog?lang=${lang}`;
}

function SiteNav({ t, currentLanguage, onLanguageChange, onOpenFoodMenu }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  const blogPath = buildBlogPath(currentLanguage);

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
    document.body.classList.remove('scroll-locked');
  }, []);

  const openMobile = useCallback(() => {
    setMobileOpen(true);
    document.body.classList.add('scroll-locked');
  }, []);

  useEffect(() => {
    closeMobile();
  }, [location.pathname, closeMobile]);

  useEffect(() => {
    return () => document.body.classList.remove('scroll-locked');
  }, []);

  const handleMenuClick = (e) => {
    if (isHome && onOpenFoodMenu) {
      e.preventDefault();
      onOpenFoodMenu();
      closeMobile();
    }
  };

  const navLinks = [
    { href: isHome ? '#home' : '/#home', label: t.nav.home, isHash: true },
    { href: isHome ? '#about' : '/#about', label: t.nav.about, isHash: true },
    {
      href: isHome ? '#alacarte' : '/#alacarte',
      label: t.nav.menu,
      isHash: true,
      onClick: handleMenuClick,
    },
    { href: blogPath, label: t.nav.blog, isHash: false },
    { href: isHome ? '#contact' : '/#contact', label: t.nav.contact, isHash: true },
  ];

  const renderLink = (link, className, onNavigate) => {
    if (link.isHash) {
      return (
        <a
          key={link.label}
          href={link.href}
          className={className}
          onClick={(e) => {
            link.onClick?.(e);
            onNavigate?.();
          }}
        >
          {link.label}
        </a>
      );
    }
    return (
      <Link key={link.label} to={link.href} className={className} onClick={onNavigate}>
        {link.label}
      </Link>
    );
  };

  return (
    <>
      <nav className="navbar" aria-label="Main navigation">
        <div className="nav-container">
          <Link to="/" className="logo-home-link logo-container" onClick={closeMobile}>
            <img
              src="/images/ullishtja_logo.jpeg"
              alt="Ullishtja Agroturizem"
              className="logo"
              width="70"
              height="56"
              loading="eager"
            />
          </Link>

          <div className="nav-menu">
            {navLinks.map((link) => renderLink(link, 'nav-link'))}
          </div>

          <div className="language-selector navbar-lang">
            <button
              type="button"
              className={`lang-btn ${currentLanguage === 'al' ? 'active' : ''}`}
              onClick={() => onLanguageChange('al')}
            >
              AL
            </button>
            <button
              type="button"
              className={`lang-btn ${currentLanguage === 'en' ? 'active' : ''}`}
              onClick={() => onLanguageChange('en')}
            >
              EN
            </button>
            <button
              type="button"
              className={`lang-btn ${currentLanguage === 'it' ? 'active' : ''}`}
              onClick={() => onLanguageChange('it')}
            >
              IT
            </button>
          </div>

          <button
            type="button"
            className="hamburger-btn"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            onClick={() => (mobileOpen ? closeMobile() : openMobile())}
          >
            <span className={`hamburger-line ${mobileOpen ? 'active' : ''}`} />
            <span className={`hamburger-line ${mobileOpen ? 'active' : ''}`} />
            <span className={`hamburger-line ${mobileOpen ? 'active' : ''}`} />
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <button
          type="button"
          className="mobile-nav-backdrop"
          aria-label="Close menu"
          onClick={closeMobile}
        />
      )}

      <div className={`mobile-nav ${mobileOpen ? 'active' : ''}`} aria-hidden={!mobileOpen}>
        <div className="mobile-nav-header">
          <Link to="/" onClick={closeMobile}>
            <img src="/images/ullishtja_logo.jpeg" alt="Ullishtja" className="mobile-logo" />
          </Link>
          <button type="button" className="mobile-close-btn" onClick={closeMobile} aria-label="Close">
            ×
          </button>
        </div>

        <nav className="mobile-nav-menu">
          {navLinks.map((link) => renderLink(link, 'mobile-nav-link', closeMobile))}
        </nav>

        <div className="mobile-language-selector">
          <button
            type="button"
            className={`mobile-lang-btn ${currentLanguage === 'al' ? 'active' : ''}`}
            onClick={() => onLanguageChange('al')}
          >
            AL
          </button>
          <button
            type="button"
            className={`mobile-lang-btn ${currentLanguage === 'en' ? 'active' : ''}`}
            onClick={() => onLanguageChange('en')}
          >
            EN
          </button>
          <button
            type="button"
            className={`mobile-lang-btn ${currentLanguage === 'it' ? 'active' : ''}`}
            onClick={() => onLanguageChange('it')}
          >
            IT
          </button>
        </div>
      </div>
    </>
  );
}

export default SiteNav;
