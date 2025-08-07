import React, { useState, useEffect } from 'react';
import './LanguageFloatingSelector.css';

const LanguageFloatingSelector = ({ currentLanguage, onLanguageChange, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasBeenDismissed, setHasBeenDismissed] = useState(false);

  const languages = [
    {
      code: 'al',
      name: 'Shqip',
      flag: '🇦🇱',
      shortName: 'AL'
    },
    {
      code: 'en',
      name: 'English',
      flag: '🇺🇸',
      shortName: 'EN'
    },
    {
      code: 'it',
      name: 'Italiano',
      flag: '🇮🇹',
      shortName: 'IT'
    }
  ];

  // Check if user has dismissed the language selector before
  useEffect(() => {
    // Temporarily clear for testing - remove this in production
    localStorage.removeItem('languageSelectorDismissed');
    localStorage.removeItem('preferredLanguage');
    
    const dismissed = localStorage.getItem('languageSelectorDismissed');
    const hasPreference = localStorage.getItem('preferredLanguage');
    
    // Show if user hasn't dismissed it and doesn't have a preference, or on first visit
    if (!dismissed && !hasPreference) {
      setIsVisible(true);
      // Auto-expand on mobile for better UX
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        setIsExpanded(true);
      }
    }
  }, []);

  const handleLanguageSelect = (languageCode) => {
    onLanguageChange(languageCode);
    
    // Store preference and mark as dismissed
    localStorage.setItem('preferredLanguage', languageCode);
    localStorage.setItem('languageSelectorDismissed', 'true');
    
    // Hide the selector with animation
    handleDismiss();
  };

  const handleDismiss = () => {
    setHasBeenDismissed(true);
    localStorage.setItem('languageSelectorDismissed', 'true');
    
    // Fade out animation
    setTimeout(() => {
      setIsVisible(false);
      if (onDismiss) onDismiss();
    }, 300);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  if (!isVisible) return null;

  return (
    <div className="language-floating-container">
      <div className={`language-floating-selector ${isExpanded ? 'expanded' : 'collapsed'} ${hasBeenDismissed ? 'dismissing' : ''}`}>
        <div className="language-floating-content">
          {/* Header */}
          <div className="language-floating-header">
            <div className="language-floating-info">
              <span className="language-icon">🌐</span>
              <div className="language-text">
                <span className="language-title">Choose Language</span>
                <span className="language-subtitle">Select your preferred language</span>
              </div>
            </div>
            
            <div className="language-floating-actions">
              {!isExpanded && (
                <button 
                  className="language-toggle-btn"
                  onClick={toggleExpanded}
                  aria-label="Open language options"
                >
                  <span className="current-lang">{languages.find(l => l.code === currentLanguage)?.shortName || 'AL'}</span>
                  <span className="chevron">▼</span>
                </button>
              )}
              
              <button 
                className="language-dismiss-btn"
                onClick={handleDismiss}
                aria-label="Dismiss language selector"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Language options - shown when expanded */}
          {isExpanded && (
            <div className="language-floating-options">
              {languages.map((language) => (
                <button
                  key={language.code}
                  className={`language-floating-option ${currentLanguage === language.code ? 'active' : ''}`}
                  onClick={() => handleLanguageSelect(language.code)}
                >
                  <span className="language-flag">{language.flag}</span>
                  <span className="language-name">{language.name}</span>
                  <span className="language-short">{language.shortName}</span>
                  {currentLanguage === language.code && (
                    <span className="language-check">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Collapse button for mobile */}
          {isExpanded && (
            <div className="language-floating-footer">
              <button 
                className="language-collapse-btn desktop-hidden"
                onClick={toggleExpanded}
              >
                Collapse
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LanguageFloatingSelector;