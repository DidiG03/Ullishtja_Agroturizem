import React, { useState, useEffect } from 'react';
import './LanguageSelector.css';

const LanguageSelector = ({ isVisible, onSelectLanguage, onDismiss }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Auto-expand on mobile for better UX
  useEffect(() => {
    if (isVisible) {
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        setIsExpanded(true);
      }
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const handleLanguageSelect = (language) => {
    // Store the language preference in localStorage
    localStorage.setItem('preferredLanguage', language);
    localStorage.setItem('hasVisitedBefore', 'true');
    
    // Call the parent function to set the language
    onSelectLanguage(language);
    
    // Dismiss the selector
    handleDismiss();
  };

  const handleDismiss = () => {
    setIsClosing(true);
    setTimeout(() => {
      onDismiss();
      setIsClosing(false);
    }, 300);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

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

  return (
    <div className={`language-selector ${isExpanded ? 'expanded' : ''} ${isClosing ? 'closing' : ''}`}>
      <div className="language-selector-content">
        {/* Header */}
        <div className="language-selector-header">
          <div className="language-selector-icon">🌍</div>
          <div className="language-selector-text">
            <div className="language-selector-title">Choose Language</div>
            <div className="language-selector-subtitle">Select your preferred language</div>
          </div>
          <button 
            className="language-selector-dismiss"
            onClick={handleDismiss}
            aria-label="Dismiss language selector"
          >
            ✕
          </button>
        </div>

        {/* Collapsed state - show expand button */}
        {!isExpanded && (
          <div className="language-selector-actions">
            <button 
              className="language-selector-expand"
              onClick={toggleExpanded}
            >
              Select Language
            </button>
          </div>
        )}

        {/* Expanded state - show language options */}
        {isExpanded && (
          <div className="language-selector-options">
            {languages.map((language) => (
              <button
                key={language.code}
                className="language-option-compact"
                onClick={() => handleLanguageSelect(language.code)}
              >
                <span className="language-flag-compact">{language.flag}</span>
                <span className="language-name-compact">{language.name}</span>
                <span className="language-short-compact">{language.shortName}</span>
              </button>
            ))}
          </div>
        )}

        {/* Note */}
        {isExpanded && (
          <div className="language-selector-note">
            You can change this later in the footer
          </div>
        )}
      </div>
    </div>
  );
};

export default LanguageSelector;