import React, { useState, useEffect } from 'react';
import './LanguageSelectionModal.css';

const LanguageSelectionModal = ({ isVisible, onLanguageSelect }) => {
  const [selectedLanguage, setSelectedLanguage] = useState(null);

  const languages = [
    {
      code: 'al',
      name: 'Shqip',
      flag: '🇦🇱',
      description: 'Albanian'
    },
    {
      code: 'en',
      name: 'English',
      flag: '🇺🇸',
      description: 'English'
    },
    {
      code: 'it',
      name: 'Italiano',
      flag: '🇮🇹',
      description: 'Italian'
    }
  ];

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('language-modal-open');
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('language-modal-open');
    }

    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('language-modal-open');
    };
  }, [isVisible]);

  const handleLanguageClick = (languageCode) => {
    setSelectedLanguage(languageCode);
  };

  const handleConfirm = () => {
    if (selectedLanguage && onLanguageSelect) {
      onLanguageSelect(selectedLanguage);
    }
  };

  const getWelcomeText = () => {
    return {
      title: "Welcome to Ullishtja Agroturizem",
      subtitle: "Please select your preferred language",
      confirmButton: "Continue"
    };
  };

  if (!isVisible) return null;

  const welcomeText = getWelcomeText();

  return (
    <div className="language-selection-overlay">
      <div className="language-selection-modal">
        <div className="language-modal-content">
          {/* Header */}
          <div className="language-modal-header">
            <div className="welcome-icon">🌍</div>
            <h1 className="welcome-title">{welcomeText.title}</h1>
            <p className="welcome-subtitle">{welcomeText.subtitle}</p>
          </div>

          {/* Language Options */}
          <div className="language-options">
            {languages.map((language) => (
              <button
                key={language.code}
                className={`language-option ${selectedLanguage === language.code ? 'selected' : ''}`}
                onClick={() => handleLanguageClick(language.code)}
              >
                <span className="language-flag">{language.flag}</span>
                <div className="language-info">
                  <span className="language-name">{language.name}</span>
                  <span className="language-description">{language.description}</span>
                </div>
                {selectedLanguage === language.code && (
                  <span className="selection-check">✓</span>
                )}
              </button>
            ))}
          </div>

          {/* Continue Button */}
          <div className="language-modal-footer">
            <button 
              className={`continue-button ${selectedLanguage ? 'active' : 'disabled'}`}
              onClick={handleConfirm}
              disabled={!selectedLanguage}
            >
              {welcomeText.confirmButton}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelectionModal;