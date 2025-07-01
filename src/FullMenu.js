import React, { useState } from 'react';
import { translations } from './translations';
import './FullMenu.css';

function FullMenu({ currentLanguage, onClose }) {
  const [activeCategory, setActiveCategory] = useState('appetizers');
  const t = translations[currentLanguage];

  const categories = [
    { id: 'appetizers', name: t.fullMenu.categories.appetizers },
    { id: 'soups', name: t.fullMenu.categories.soups },
    { id: 'mains', name: t.fullMenu.categories.mains },
    { id: 'grilled', name: t.fullMenu.categories.grilled },
    { id: 'pasta', name: t.fullMenu.categories.pasta },
    { id: 'seafood', name: t.fullMenu.categories.seafood },
    { id: 'salads', name: t.fullMenu.categories.salads },
    { id: 'desserts', name: t.fullMenu.categories.desserts },
    { id: 'beverages', name: t.fullMenu.categories.beverages }
  ];

  return (
    <div className="full-menu-overlay">
      <div className="full-menu-container">
        <div className="full-menu-header">
          <h1>{t.fullMenu.title}</h1>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="menu-content">
          {/* Category Navigation */}
          <div className="category-nav">
            {categories.map(category => (
              <button
                key={category.id}
                className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Menu Items */}
          <div className="menu-items-container">
            <div className="menu-category-section">
              <h2>{categories.find(cat => cat.id === activeCategory)?.name}</h2>
              <div className="menu-items-grid">
                {t.fullMenu.items[activeCategory]?.map((item, index) => (
                  <div key={index} className="menu-item-card">
                    <div className="item-header">
                      <h3>{item.name}</h3>
                      <span className="item-price">{item.price}</span>
                    </div>
                    <p className="item-description">{item.description}</p>
                    {item.ingredients && (
                      <div className="item-ingredients">
                        <small>{t.fullMenu.ingredients}: {item.ingredients}</small>
                      </div>
                    )}
                    {item.spicy && <span className="spicy-indicator">🌶️</span>}
                    {item.vegetarian && <span className="vegetarian-indicator">🌱</span>}
                    {item.recommended && <span className="recommended-badge">{t.fullMenu.recommended}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FullMenu; 