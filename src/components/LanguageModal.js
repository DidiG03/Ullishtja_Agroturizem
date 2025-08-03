import React, { useEffect } from 'react';
import './LanguageModal.css';

const LanguageModal = ({ isOpen, onSelectLanguage }) => {
  // Disable scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      // Store original overflow value
      const originalOverflow = document.body.style.overflow;
      
      // Disable scrolling
      document.body.style.overflow = 'hidden';
      
      // Cleanup function to restore scrolling
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLanguageSelect = (language) => {
    // Store the language preference in localStorage
    localStorage.setItem('preferredLanguage', language);
    localStorage.setItem('hasVisitedBefore', 'true');
    
    // Call the parent function to set the language
    onSelectLanguage(language);
  };

  const languages = [
    {
      code: 'al',
      name: 'Shqip',
      flag: '🇦🇱',
      greeting: 'Mirë se vini!',
      description: 'Vazhdoni në gjuhën shqipe'
    },
    {
      code: 'en',
      name: 'English',
      flag: '🇺🇸',
      greeting: 'Welcome!',
      description: 'Continue in English'
    },
    {
      code: 'it',
      name: 'Italiano',
      flag: '🇮🇹',
      greeting: 'Benvenuti!',
      description: 'Continua in italiano'
    }
  ];

  return (
    <div className="language-modal-overlay">
      <div className="language-modal">
        <div className="language-modal-header">
          <div className="welcome-icon">🌍</div>
          <h2 className="modal-title">Welcome to Ullishtja Agriturizem</h2>
          <p className="modal-subtitle">Please select your preferred language</p>
        </div>

        <div className="language-options">
          {languages.map((language) => (
            <button
              key={language.code}
              className="language-option"
              onClick={() => handleLanguageSelect(language.code)}
            >
              <div className="language-flag">{language.flag}</div>
              <div className="language-info">
                <div className="language-name">{language.name}</div>
                <div className="language-greeting">{language.greeting}</div>
                <div className="language-description">{language.description}</div>
              </div>
              <div className="language-arrow">→</div>
            </button>
          ))}
        </div>

        <div className="modal-footer">
          <p className="modal-note">
            You can change the language at any time from the footer menu
          </p>
        </div>
      </div>
    </div>
  );
};

export default LanguageModal;