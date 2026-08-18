import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import LanguageSwitcher from './LanguageSwitcher';
import FloatingWhatsApp from './FloatingWhatsApp';

function buildLangPath(path, lang) {
  return lang === 'al' ? path : `${path}?lang=${lang}`;
}

function buildHomeHash(hash, lang) {
  return {
    pathname: '/',
    search: lang === 'al' ? '' : `?lang=${lang}`,
    hash,
  };
}

function SiteNav({ t, currentLanguage, onLanguageChange }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isMenuPage = location.pathname === '/menu';
  const isBlogPage = location.pathname.startsWith('/blog');

  const blogPath = buildLangPath('/blog', currentLanguage);
  const menuPath = buildLangPath('/menu', currentLanguage);

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

  const navLinks = [
    { to: buildHomeHash('#home', currentLanguage), label: t.nav.home },
    { to: buildHomeHash('#about', currentLanguage), label: t.nav.about },
    { to: menuPath, label: t.nav.menu, active: isMenuPage },
    { to: blogPath, label: t.nav.blog, active: isBlogPage },
    { to: buildHomeHash('#contact', currentLanguage), label: t.nav.contact },
  ];

  const renderLink = (link, className, onNavigate) => {
    const classes = `${className}${link.active ? ` ${className}--active` : ''}`;
    return (
      <Link key={link.label} to={link.to} className={classes} onClick={onNavigate}>
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

          <LanguageSwitcher
            variant="navbar"
            currentLanguage={currentLanguage}
            onLanguageChange={onLanguageChange}
          />

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

      <div className="mobile-nav-shell">
        <div
          className={`mobile-nav ${mobileOpen ? 'active' : ''}`}
          aria-hidden={!mobileOpen}
          {...(mobileOpen ? {} : { inert: '' })}
        >
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

          <LanguageSwitcher
            variant="drawer"
            currentLanguage={currentLanguage}
            onLanguageChange={onLanguageChange}
          />
        </div>
      </div>

      <FloatingWhatsApp currentLanguage={currentLanguage} t={t} />
    </>
  );
}

export default SiteNav;
