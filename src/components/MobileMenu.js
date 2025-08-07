import React, { useState, useEffect } from 'react';
import MenuService from '../services/menuService';
import './MobileMenu.css';

function MobileMenu({ currentLanguage, onClose }) {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMenu();
  }, []);

  useEffect(() => {
    // Prevent body scrolling when menu is open - use CSS class instead of direct style manipulation
    document.body.classList.add('mobile-menu-open');
    
    return () => {
      // Restore scrolling when menu closes
      document.body.classList.remove('mobile-menu-open');
    };
  }, []);

  const loadMenu = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await MenuService.getCompleteMenu();
      
      if (data && data.success) {
        const categoriesData = data.data || [];
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        if (Array.isArray(categoriesData) && categoriesData.length > 0) {
          setActiveCategory(categoriesData[0].id);
        }
      } else {
        throw new Error(data?.error || 'Failed to load menu');
      }
    } catch (error) {
      console.error('Error loading menu:', error);
      setError('Failed to load menu. Please try again.');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const getLocalizedText = (item, field) => {
    const fieldMap = {
      'al': `${field}AL`,
      'en': `${field}EN`, 
      'it': `${field}IT`
    };
    
    const fieldName = fieldMap[currentLanguage] || fieldMap['al'];
    return item[fieldName] || item[`${field}AL`] || '';
  };

  const getCurrentCategory = () => {
    return categories.find(cat => cat.id === activeCategory);
  };

  const getCurrentItems = () => {
    const category = getCurrentCategory();
    return category?.menuItems || [];
  };

  const formatPrice = (price) => {
    if (!price) return '';
    return `${price} ALL`;
  };

  const getMenuTitle = () => {
    switch (currentLanguage) {
      case 'en': return 'Full Menu';
      case 'it': return 'Menu Completo';
      default: return 'Menuja e Plotë';
    }
  };

  const getLoadingText = () => {
    switch (currentLanguage) {
      case 'en': return 'Loading menu...';
      case 'it': return 'Caricamento menu...';
      default: return 'Po ngarkohet menuja...';
    }
  };

  const getErrorText = () => {
    switch (currentLanguage) {
      case 'en': return 'Failed to load menu. Please try again.';
      case 'it': return 'Errore nel caricamento del menu. Riprova.';
      default: return 'Dështoi ngarkimi i menusë. Provo përsëri.';
    }
  };

  const getIngredientLabel = () => {
    switch (currentLanguage) {
      case 'en': return 'Ingredients';
      case 'it': return 'Ingredienti';
      default: return 'Përbërësit';
    }
  };

  if (loading) {
    return (
      <div className="mobile-menu-overlay">
        <div className="mobile-menu-container">
          <div className="mobile-menu-header">
            <h1>{getMenuTitle()}</h1>
            <button className="mobile-close-btn" onClick={onClose}>✕</button>
          </div>
          <div className="mobile-menu-loading">
            <div className="loading-spinner"></div>
            <p>{getLoadingText()}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mobile-menu-overlay">
        <div className="mobile-menu-container">
          <div className="mobile-menu-header">
            <h1>{getMenuTitle()}</h1>
            <button className="mobile-close-btn" onClick={onClose}>✕</button>
          </div>
          <div className="mobile-menu-error">
            <p>{getErrorText()}</p>
            <button className="retry-btn" onClick={loadMenu}>
              {currentLanguage === 'en' ? 'Retry' : currentLanguage === 'it' ? 'Riprova' : 'Provo Përsëri'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-menu-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="mobile-menu-container">
        {/* Header */}
        <div className="mobile-menu-header">
          <h1>{getMenuTitle()}</h1>
          <button className="mobile-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Main Menu Layout */}
        <div className="mobile-menu-layout">
          {/* Categories Navigation */}
          <div className="mobile-categories-nav">
            {categories.map(category => (
              <button
                key={category.id}
                className={`mobile-category-btn ${activeCategory === category.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(category.id)}
              >
                {getLocalizedText(category, 'name')}
              </button>
            ))}
          </div>

          {/* Menu Items */}
          <div className="mobile-menu-content">
          {getCurrentCategory() && (
            <>
              <h2 className="mobile-category-title">
                {getLocalizedText(getCurrentCategory(), 'name')}
              </h2>
              <div className="mobile-menu-items">
                {getCurrentItems().map((item, index) => (
                  <div key={index} className="mobile-menu-item">
                    <div className="mobile-item-header">
                      <h3 className="mobile-item-name">
                        {getLocalizedText(item, 'name')}
                      </h3>
                      <span className="mobile-item-price">
                        {formatPrice(item.price)}
                      </span>
                    </div>
                    {getLocalizedText(item, 'description') && (
                      <p className="mobile-item-description">
                        {getLocalizedText(item, 'description')}
                      </p>
                    )}
                    {getLocalizedText(item, 'ingredients') && (
                      <div className="mobile-item-ingredients">
                        <small>
                          <strong>{getIngredientLabel()}:</strong> {getLocalizedText(item, 'ingredients')}
                        </small>
                      </div>
                    )}
                    <div className="mobile-item-badges">
                      {item.isVegetarian && (
                        <span className="mobile-badge vegetarian">🌱 
                          {currentLanguage === 'en' ? 'Vegetarian' : 
                           currentLanguage === 'it' ? 'Vegetariano' : 'Vegjetarian'}
                        </span>
                      )}
                      {item.isSpicy && (
                        <span className="mobile-badge spicy">🌶️ 
                          {currentLanguage === 'en' ? 'Spicy' : 
                           currentLanguage === 'it' ? 'Piccante' : 'I Djegët'}
                        </span>
                      )}
                      {item.isRecommended && (
                        <span className="mobile-badge recommended">⭐ 
                          {currentLanguage === 'en' ? 'Recommended' : 
                           currentLanguage === 'it' ? 'Consigliato' : 'I Rekomanduar'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MobileMenu;