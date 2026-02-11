import { useEffect, useCallback } from 'react';

const SEOHead = ({ 
  currentLanguage = 'al', 
  pageSection = 'home',
  customTitle = null,
  customDescription = null,
  customKeywords = null,
  customImage = null
}) => {
  // const t = translations[currentLanguage] || translations.al; // not needed here
  
  // SEO data for different sections and languages
  const seoData = {
    home: {
      al: {
        title: "Ullishtja Agroturizem - Restorant Autentik Shqiptar në Durrës | Ferma në Tavolinë",
        description: "Përjetoni kuzhinën autentike shqiptare tek Ullishtja Agroturizem në Durrës. Përbërës të freskët nga ferma, receta tradicionale dhe pamje 360° të maleve. E përsosur për dasma, evente dhe darkë familjare. Hapur çdo ditë 11:00-22:00.",
        keywords: "restorant shqiptar Durrës, ushqim organik Shqipëri, kuzhina tradicionale shqiptare, agroturizëm Durrës, restorant malor Shqipëri, dasma venue Durrës, ushqim nga ferma Shqipëri, specialitete shqiptare, Ullishtja Agroturizem"
      },
      en: {
        title: "Ullishtja Agroturizem - Authentic Albanian Restaurant in Durres | Farm-to-Table Dining",
        description: "Experience authentic Albanian cuisine at Ullishtja Agroturizem in Durres. Fresh farm-to-table ingredients, traditional recipes, and breathtaking 360° mountain views. Perfect for weddings, events, and family dining. Open daily 11:00-22:00.",
        keywords: "Albanian restaurant Durres, farm to table dining Albania, authentic Albanian cuisine, traditional Albanian food, Durres restaurants, agrotourism Albania, Albanian wedding venue, organic restaurant Albania, mountain view restaurant, Albanian specialties"
      },
      it: {
        title: "Ullishtja Agroturizem - Ristorante Albanese Autentico a Durazzo | Cucina dalla Fattoria",
        description: "Vivi la cucina albanese autentica presso Ullishtja Agroturizem a Durazzo. Ingredienti freschi dalla fattoria, ricette tradizionali e viste mozzafiato a 360° sulle montagne. Perfetto per matrimoni, eventi e cene familiari. Aperto tutti i giorni 11:00-22:00.",
        keywords: "ristorante albanese Durazzo, cucina dalla fattoria Albania, cucina tradizionale albanese, cibo albanese autentico, ristoranti Durazzo, agriturismo Albania, venue matrimoni Albania, ristorante biologico Albania, specialità albanesi"
      }
    },
    menu: {
      al: {
        title: "Menuja Tradicionale Shqiptare - Ullishtja Agroturizem | A la Carte & Specialitete",
        description: "Zbuloni menunë e plotë të Ullishtja Agroturizem me specialitete tradicionale shqiptare. Tavë kosi, qofte të fërguara, byrek me spinaq dhe më shumë. Përbërës të freskët nga ferma jonë.",
        keywords: "menu shqiptar tradicional, specialitete shqiptare, tavë kosi, qofte shqiptare, byrek spinaq, ushqim autentik shqiptar, restaurant menu Durrës"
      },
      en: {
        title: "Traditional Albanian Menu - Ullishtja Agroturizem | A la Carte & Specialties",
        description: "Discover Ullishtja Agroturizem's complete menu featuring traditional Albanian specialties. Tavë kosi, grilled qofte, spinach byrek and more. Fresh ingredients from our farm.",
        keywords: "traditional Albanian menu, Albanian specialties, tavë kosi, Albanian qofte, spinach byrek, authentic Albanian food, restaurant menu Durres"
      },
      it: {
        title: "Menu Tradizionale Albanese - Ullishtja Agroturizem | A la Carte e Specialità",
        description: "Scopri il menu completo di Ullishtja Agroturizem con specialità tradizionali albanesi. Tavë kosi, qofte alla griglia, byrek di spinaci e altro. Ingredienti freschi dalla nostra fattoria.",
        keywords: "menu tradizionale albanese, specialità albanesi, tavë kosi, qofte albanesi, byrek spinaci, cibo autentico albanese, menu ristorante Durazzo"
      }
    },
    events: {
      al: {
        title: "Evente dhe Dasma - Ullishtja Agroturizem | Venue për Festa në Durrës",
        description: "Organizoni eventin tuaj të përsosur tek Ullishtja Agroturizem. Dasma tradicionale shqiptare, evente korporative dhe festa familjare. Kapacitet deri në 120 mysafirë me pamje malore.",
        keywords: "dasma venue Durrës, evente korporative Shqipëri, festa familjare venue, organizim dasmash Durrës, venue events Shqipëri, restaurant events Durrës"
      },
      en: {
        title: "Weddings & Events - Ullishtja Agroturizem | Event Venue in Durres",
        description: "Host your perfect event at Ullishtja Agroturizem. Traditional Albanian weddings, corporate events, and family celebrations. Capacity up to 120 guests with mountain views.",
        keywords: "wedding venue Durres, corporate events Albania, family celebration venue, wedding planning Durres, event venue Albania, restaurant events Durres"
      },
      it: {
        title: "Matrimoni ed Eventi - Ullishtja Agroturizem | Location Eventi a Durazzo",
        description: "Organizza il tuo evento perfetto presso Ullishtja Agroturizem. Matrimoni tradizionali albanesi, eventi aziendali e celebrazioni familiari. Capacità fino a 120 ospiti con vista sulle montagne.",
        keywords: "location matrimoni Durazzo, eventi aziendali Albania, venue celebrazioni familiari, organizzazione matrimoni Durazzo, location eventi Albania"
      }
    }
  };

  // Get current section data
  const currentSeoData = seoData[pageSection]?.[currentLanguage] || seoData.home[currentLanguage];
  
  // Use custom data if provided, otherwise use section-specific data
  const title = customTitle || currentSeoData.title;
  const description = customDescription || currentSeoData.description;
  const keywords = customKeywords || currentSeoData.keywords;
  const image = customImage || "https://ullishtja-agroturizem.com/images/posters/hero-poster.jpg";

  // Language-specific Open Graph locale
  const getOGLocale = (lang) => {
    switch (lang) {
      case 'al': return 'sq_AL';
      case 'en': return 'en_US';
      case 'it': return 'it_IT';
      default: return 'sq_AL';
    }
  };

  // Update meta tags dynamically
  useEffect(() => {
    // Update document title
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (property, content, attribute = 'name') => {
      let metaTag = document.querySelector(`meta[${attribute}="${property}"]`);
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.setAttribute(attribute, property);
        document.head.appendChild(metaTag);
      }
      metaTag.setAttribute('content', content);
    };

    // Update basic meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    updateMetaTag('title', title);

    // Update Open Graph tags
    updateMetaTag('og:title', title, 'property');
    updateMetaTag('og:description', description, 'property');
    updateMetaTag('og:image', image, 'property');
    updateMetaTag('og:url', `https://ullishtja-agroturizem.com/${pageSection !== 'home' ? '#' + pageSection : ''}`, 'property');
    updateMetaTag('og:locale', getOGLocale(currentLanguage), 'property');

    // Update Twitter tags (Twitter uses name, not property)
    updateMetaTag('twitter:title', title, 'name');
    updateMetaTag('twitter:description', description, 'name');
    updateMetaTag('twitter:image', image, 'name');

    // Update language-specific canonical URL
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.href = `https://ullishtja-agroturizem.com/${currentLanguage !== 'al' ? '?lang=' + currentLanguage : ''}`;
    }

    // Track page view for analytics
    if (window.gtag) {
      window.gtag('config', 'GA_MEASUREMENT_ID', {
        page_title: title,
        page_location: window.location.href,
        language: currentLanguage
      });
    }

  }, [title, description, keywords, image, pageSection, currentLanguage]);

  // Generate structured data for the current section (memoized)
  const getStructuredData = useCallback(() => {
    const baseStructuredData = {
      "@context": "https://schema.org",
      "@type": "Restaurant",
      "name": "Ullishtja Agroturizem",
      "url": "https://ullishtja-agroturizem.com",
      "description": description,
      "image": image,
      "telephone": "+355 68 409 0405",
      "email": "hi@ullishtja-agroturizem.com",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Ullishtja Agroturizem",
        "addressLocality": "Durres",
        "addressCountry": "AL"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 41.340278,
        "longitude": 19.433569
      },
      "openingHours": "Mo-Su 11:00-22:00",
      "servesCuisine": ["Albanian", "Mediterranean", "Farm-to-table"],
      "priceRange": "$$"
    };

    // Add section-specific structured data
    if (pageSection === 'menu') {
      baseStructuredData.hasMenu = "https://ullishtja-agroturizem.com/#menu";
      baseStructuredData["@type"] = ["Restaurant", "FoodEstablishment"];
    } else if (pageSection === 'events') {
      baseStructuredData.amenityFeature = [
        {
          "@type": "LocationFeatureSpecification",
          "name": "Wedding Venue",
          "value": "Up to 120 guests"
        },
        {
          "@type": "LocationFeatureSpecification",
          "name": "Event Space",
          "value": "Corporate and family events"
        }
      ];
    }

    return baseStructuredData;
  }, [description, image, pageSection]);

  // Add structured data script to head
  useEffect(() => {
    const structuredDataScript = document.getElementById('dynamic-structured-data');
    if (structuredDataScript) {
      structuredDataScript.remove();
    }

    const script = document.createElement('script');
    script.id = 'dynamic-structured-data';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(getStructuredData());
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById('dynamic-structured-data');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [pageSection, currentLanguage, description, image, getStructuredData]);

  // This component doesn't render anything visible
  return null;
};

export default SEOHead;