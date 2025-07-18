import React, { memo } from 'react';
import './Gallery.css';

const Gallery = memo(({ currentLanguage, translations }) => {
  const t = translations;

  // Sample gallery images - these will be replaced with actual restaurant photos
  const galleryImages = [
    {
      id: 1,
      src: '/images/food.jpeg',
      alt: 'Traditional Albanian Cuisine',
      category: 'food',
      title: {
        al: 'Ushqim tradicional shqiptar',
        en: 'Traditional Albanian Food',
        it: 'Cucina tradizionale albanese'
      }
    },
    {
      id: 2,
      src: '/images/panorama.jpeg',
      alt: 'Restaurant Panoramic View',
      category: 'ambiance',
      title: {
        al: 'Pamje panoramike e restorantit',
        en: 'Restaurant Panoramic View',
        it: 'Vista panoramica del ristorante'
      }
    },
    {
      id: 3,
      src: '/images/logo_wall.jpeg',
      alt: 'Restaurant Interior',
      category: 'interior',
      title: {
        al: 'Ambienti i brendshëm',
        en: 'Restaurant Interior',
        it: 'Interno del ristorante'
      }
    },
    {
      id: 4,
      src: '/images/ullishtja_logo.jpeg',
      alt: 'Ullishtja Logo',
      category: 'branding',
      title: {
        al: 'Logoja e Ullishtjës',
        en: 'Ullishtja Logo',
        it: 'Logo di Ullishtja'
      }
    },
    // Add more placeholder images
    {
      id: 5,
      src: '/images/test.jpeg',
      alt: 'Chef Preparation',
      category: 'food',
      title: {
        al: 'Përgatitja nga shefi',
        en: 'Chef Preparation',
        it: 'Preparazione dello chef'
      }
    },
    {
      id: 6,
      src: '/images/food.jpeg',
      alt: 'Fresh Ingredients',
      category: 'ingredients',
      title: {
        al: 'Përbërës të freskët',
        en: 'Fresh Ingredients',
        it: 'Ingredienti freschi'
      }
    },
    {
      id: 7,
      src: '/images/panorama.jpeg',
      alt: 'Mountain View',
      category: 'ambiance',
      title: {
        al: 'Pamje malore',
        en: 'Mountain View',
        it: 'Vista montana'
      }
    }
  ];



  return (
    <section className="gallery" id="gallery">
      <div className="container">
        <div className="gallery-header">
          <h2 className="gallery-title">
            {currentLanguage === 'al' ? 'Galeria Jonë' : 
             currentLanguage === 'en' ? 'Our Gallery' : 
             'La Nostra Galleria'}
          </h2>
          <p className="gallery-subtitle">
            {currentLanguage === 'al' ? 'Zbuloni atmosferën dhe ushqimin tonë të mrekullueshëm' :
             currentLanguage === 'en' ? 'Discover our wonderful atmosphere and cuisine' :
             'Scoprite la nostra meravigliosa atmosfera e cucina'}
          </p>
        </div>

        <div className="gallery-grid">
          {galleryImages.map((image, index) => (
            <div 
              key={image.id} 
              className={`gallery-item gallery-item-${(index % 4) + 1}`}
            >
              <div className="gallery-image-container">
                <img 
                  src={image.src} 
                  alt={image.alt}
                  className="gallery-image"
                  loading="lazy"
                />
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
});

Gallery.displayName = 'Gallery';

export default Gallery; 