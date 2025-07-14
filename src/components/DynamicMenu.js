import React, { useState, useEffect } from 'react';
import MenuService from '../services/menuService';
import '../FullMenu.css';

function DynamicMenu({ currentLanguage, onClose }) {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      setLoading(true);
      const data = await MenuService.getCompleteMenu();
      console.log('DynamicMenu API response:', data); // Debug log
      
      if (data && data.success) {
        const categories = data.data || [];
        console.log('DynamicMenu setting categories:', categories); // Debug log
        setCategories(Array.isArray(categories) ? categories : []);
        if (Array.isArray(categories) && categories.length > 0) {
          console.log('Setting activeCategory to:', categories[0].id);
          setActiveCategory(categories[0].id);
        } else {
          console.log('No categories to set as active:', categories);
        }
      } else {
        throw new Error(data?.error || 'Failed to load menu');
      }
    } catch (error) {
      console.error('Error loading menu:', error);
      setError('Failed to load menu');
      setCategories([]); // Ensure it's always an array
    } finally {
      setLoading(false);
    }
  };

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

  const getCurrentCategory = () => {
    return Array.isArray(categories) ? categories.find(cat => cat.id === activeCategory) : undefined;
  };

  const getCurrentItems = () => {
    const category = getCurrentCategory();
    console.log('getCurrentItems - activeCategory:', activeCategory);
    console.log('getCurrentItems - category:', category);
    console.log('getCurrentItems - category.menuItems:', category?.menuItems);
    const items = category ? category.menuItems || [] : [];
    console.log('getCurrentItems - returning items:', items);
    return items;
  };

  if (loading) {
    return (
      <div className="full-menu-overlay">
        <div className="full-menu-container">
          <div className="loading">Loading menu...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="full-menu-overlay">
        <div className="full-menu-container">
          <div className="error">{error}</div>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="full-menu-overlay">
      <div className="full-menu-container">
        <div className="full-menu-header">
          <h1>
            {currentLanguage === 'al' && 'Menuja e Plotë'}
            {currentLanguage === 'en' && 'Full Menu'}
            {currentLanguage === 'it' && 'Menu Completo'}
          </h1>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="menu-content">
          {/* Category Navigation */}
          <div className="category-nav">
            {(Array.isArray(categories) ? categories : []).map(category => (
              <button
                key={category.id}
                className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(category.id)}
              >
                {getLocalizedName(category)}
              </button>
            ))}
          </div>

          {/* Menu Items */}
          <div className="menu-items-container">
            <div className="menu-category-section">
              <h2>{getCurrentCategory() ? getLocalizedName(getCurrentCategory()) : ''}</h2>
              <div className="menu-items-grid">
                {(() => {
                  const items = getCurrentItems();
                  console.log('Rendering items:', items.length, 'items');
                  return items.map((item, index) => (
                  <div key={item.id} className="menu-item-card">
                    <div className="item-header">
                      <h3>{getLocalizedName(item)}</h3>
                      <span className="item-price">{item.price} {item.currency}</span>
                    </div>
                    <p className="item-description">
                      {getLocalizedText(item, 'description')}
                    </p>
                    {getLocalizedText(item, 'ingredients') && (
                      <div className="item-ingredients">
                        <small>
                          <strong>
                            {currentLanguage === 'al' && 'Përbërësit: '}
                            {currentLanguage === 'en' && 'Ingredients: '}
                            {currentLanguage === 'it' && 'Ingredienti: '}
                          </strong>
                          {getLocalizedText(item, 'ingredients')}
                        </small>
                      </div>
                    )}
                    <div className="item-badges">
                      {item.isSpicy && <span className="spicy-indicator">🌶️</span>}
                      {item.isVegetarian && <span className="vegetarian-indicator">🌱</span>}
                      {item.isRecommended && (
                        <span className="recommended-badge">
                          {currentLanguage === 'al' && 'I Rekomanduar'}
                          {currentLanguage === 'en' && 'Recommended'}
                          {currentLanguage === 'it' && 'Consigliato'}
                        </span>
                      )}
                      {item.isNew && (
                        <span className="new-badge">
                          {currentLanguage === 'al' && 'E Re'}
                          {currentLanguage === 'en' && 'New'}
                          {currentLanguage === 'it' && 'Nuovo'}
                        </span>
                      )}
                    </div>
                  </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DynamicMenu; 