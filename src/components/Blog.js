import React, { useState, useEffect, useMemo } from 'react';
import './Blog.css';
import { translations } from '../translations';
import SEOHead from './SEOHead';
import Layout from './Layout';
import blogService from '../services/blogService';

// Helper function to get language from localStorage or detect browser language
const getInitialLanguage = () => {
  // Check if user has a stored preference
  const storedLanguage = localStorage.getItem('preferredLanguage');
  if (storedLanguage && ['al', 'en', 'it'].includes(storedLanguage)) {
    return storedLanguage;
  }

  // Check URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const urlLang = urlParams.get('lang');
  if (urlLang && ['al', 'en', 'it'].includes(urlLang)) {
    localStorage.setItem('preferredLanguage', urlLang);
    return urlLang;
  }

  // If no stored preference, try to detect browser language
  const browserLang = navigator.language || navigator.languages[0];
  if (browserLang) {
    const langCode = browserLang.toLowerCase();
    if (langCode.startsWith('sq') || langCode.startsWith('al')) return 'al'; // Albanian
    if (langCode.startsWith('it')) return 'it'; // Italian
    if (langCode.startsWith('en')) return 'en'; // English
  }

  // Default to Albanian
  return 'al';
};

const Blog = ({ currentLanguage: propLanguage }) => {
  const [currentLanguage, setCurrentLanguage] = useState(propLanguage || getInitialLanguage());
  const [selectedPost, setSelectedPost] = useState(null);
  const [expandedPosts, setExpandedPosts] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // New state for database data
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const t = translations[currentLanguage] || translations.al;

  // Load data from database
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');

        const [postsResult, categoriesResult] = await Promise.all([
          blogService.getPosts({ 
            published: true, 
            language: currentLanguage 
          }),
          blogService.getCategories({ 
            active: true, 
            language: currentLanguage 
          })
        ]);

        setPosts(postsResult.data || []);
        setCategories(categoriesResult.data || []);
      } catch (err) {
        console.error('Error loading blog data:', err);
        setError('Failed to load blog content. Please try again later.');
        // Fallback to empty arrays so the component doesn't break
        setPosts([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentLanguage]);

  // Effect to listen for language changes and update URL
  useEffect(() => {
    const handleStorageChange = () => {
      const newLanguage = getInitialLanguage();
      if (newLanguage !== currentLanguage) {
        setCurrentLanguage(newLanguage);
      }
    };

    // Listen for storage changes (when language is changed in other tabs/components)
    window.addEventListener('storage', handleStorageChange);
    
    // Also check for prop changes
    if (propLanguage && propLanguage !== currentLanguage) {
      setCurrentLanguage(propLanguage);
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [propLanguage, currentLanguage]);

  // Effect to update URL when language changes
  useEffect(() => {
    const url = new URL(window.location);
    if (currentLanguage !== 'al') {
      url.searchParams.set('lang', currentLanguage);
    } else {
      url.searchParams.delete('lang');
    }
    
    // Update URL without refreshing the page
    window.history.replaceState({}, '', url);
  }, [currentLanguage]);

  // Filter posts by category (database-driven)
  const filteredPosts = useMemo(() => {
    if (selectedCategory === 'all') return posts;
    return posts.filter(post => post.category.slug === selectedCategory);
  }, [posts, selectedCategory]);

  // Get available categories (including "all")
  const availableCategories = useMemo(() => {
    const getAllCategoriesText = () => {
      switch (currentLanguage) {
        case 'al': return 'Të Gjitha';
        case 'it': return 'Tutti';
        case 'en': return 'All';
        default: return 'Të Gjitha';
      }
    };

    const allCategory = {
      slug: 'all',
      name: getAllCategoriesText()
    };
    return [allCategory, ...categories];
  }, [categories, currentLanguage]);



  // Format date for display
  function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { 
      year: 'numeric',
      month: 'long', 
      day: 'numeric' 
    };
    
    // Use appropriate locale based on current language
    const locale = currentLanguage === 'al' ? 'sq-AL' : 
                   currentLanguage === 'it' ? 'it-IT' : 'en-US';
    
    return date.toLocaleDateString(locale, options);
  }

  // Toggle expanded state for post excerpt
  const togglePostExpansion = (postId) => {
    setExpandedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  // Render post content with HTML
  const renderContent = (content) => {
    return <div dangerouslySetInnerHTML={{ __html: content }} />;
  };

  // Get related posts (exclude current post and same category)
  const getRelatedPosts = (currentPost) => {
    return posts
      .filter(post => post.id !== currentPost.id)
      .slice(0, 3);
  };

  // Truncate excerpt for preview
  const truncateExcerpt = (text, maxLength = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Handle back to blog from single post view
  const handleBackToBlog = () => {
    setSelectedPost(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };



  // Single post view
  if (selectedPost) {
    const relatedPosts = getRelatedPosts(selectedPost);
    
    return (
      <Layout currentLanguage={currentLanguage}>
        <div className="blog-container">
          <SEOHead 
            currentLanguage={currentLanguage}
            pageSection="blog"
            customTitle={`${selectedPost.title} - ${t.blog.title}`}
            customDescription={selectedPost.excerpt}
            customKeywords={`${selectedPost.title}, ${t.blog.categories[selectedPost.category]}, agriturismo, agricultura, ${currentLanguage === 'al' ? 'Ullishtja Shqipëri' : currentLanguage === 'it' ? 'Ullishtja Albania' : 'Ullishtja Albania'}`}
          />
          
          <div className="blog-header">
            <div className="container">
              <div className="blog-header-top" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button 
                  className="back-to-blog-btn"
                  onClick={handleBackToBlog}
                  style={{ marginTop: '30px' }}
                >
                  ←
                </button>
                <h1 className="blog-title" style={{ margin: 0 }}>{t.blog.title}</h1>
                <div style={{ width: 40 }} /> {/* Spacer to balance the layout */}
              </div>
            </div>
          </div>

        <article className="single-post">
          <div className="container">
            <header className="post-header">
              <h1 className="post-title">{selectedPost.title}</h1>
              <div className="post-meta">
                <span className="post-date">
                  {t.blog.publishedOn} {formatDate(selectedPost.publishDate)}
                </span>
                <span className="post-category">
                  {t.blog.categories[selectedPost.category]}
                </span>
              </div>
            </header>
            
            <div className="post-content">
              {renderContent(selectedPost.content)}
            </div>

            {relatedPosts.length > 0 && (
              <section className="related-posts">
                <h3>{t.blog.relatedPosts}</h3>
                <div className="related-posts-grid">
                  {relatedPosts.map(post => (
                    <article 
                      key={post.id} 
                      className="related-post-card"
                      onClick={() => setSelectedPost(post)}
                    >
                      <h4>{post.title}</h4>
                      <p>{truncateExcerpt(post.excerpt, 100)}</p>
                      <span className="read-more-link">{t.blog.readMore}</span>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>
        </article>
        </div>
      </Layout>
    );
  }

  // Blog listing view
  return (
    <Layout currentLanguage={currentLanguage}>
      <div className="blog-container">
        <SEOHead 
          currentLanguage={currentLanguage}
          pageSection="blog"
          customTitle={`${t.blog.title} - ${currentLanguage === 'al' ? 'Ullishtja Agroturizem' : currentLanguage === 'it' ? 'Ullishtja Agriturismo' : 'Ullishtja Agritourism'}`}
          customDescription={t.blog.subtitle}
          customKeywords={`blog agriturismo, agricultura organike, kuzhina tradicionale, ${currentLanguage === 'al' ? 'Ullishtja blog' : currentLanguage === 'it' ? 'blog Ullishtja' : 'Ullishtja blog'}, sustainable farming, traditional recipes`}
        />
        
        <div className="blog-header">
          <div className="container">
            <h1 className="blog-title">{t.blog.title}</h1>
            <p className="blog-subtitle">{t.blog.subtitle}</p>
          </div>
        </div>

        <div className="blog-content">
          <div className="container">
          {/* Loading State */}
          {loading && (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>{currentLanguage === 'al' ? 'Po ngarkohet...' : currentLanguage === 'it' ? 'Caricamento...' : 'Loading...'}</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="error-state">
              <p>{error}</p>
            </div>
          )}

          {/* Content */}
          {!loading && !error && (
            <>
              {/* Category Filter */}
              <div className="category-filter">
                {availableCategories.map(category => (
                  <button
                    key={category.slug}
                    className={`category-btn ${selectedCategory === category.slug ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(category.slug)}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
              {/* Blog Posts Grid */}
              <div className="blog-posts-grid">
                {filteredPosts.length === 0 ? (
                  <div className="no-posts">
                    <p>{currentLanguage === 'al' ? 'Nuk ka postime në këtë kategori.' : 
                         currentLanguage === 'it' ? 'Nessun post in questa categoria.' : 
                         'No posts in this category.'}</p>
                  </div>
                ) : (
                  filteredPosts.map(post => (
                    <article key={post.id} className="blog-post-card">
                      {post.featuredImageUrl && (
                        <div className="post-card-image">
                          <img 
                            src={post.featuredImageUrl} 
                            alt={post.featuredImageAlt || post.title}
                          />
                        </div>
                      )}
                      
                      <div className="post-card-header">
                        <h2 className="post-card-title">{post.title}</h2>
                        <div className="post-card-meta">
                          <span className="post-date">
                            {formatDate(post.publishedAt || post.createdAt)}
                          </span>
                          <span className="post-category">
                            {post.category.name}
                          </span>
                          {post.isFeatured && (
                            <span className="featured-badge">
                              {currentLanguage === 'al' ? 'I Zgjedhur' : 
                               currentLanguage === 'it' ? 'In Evidenza' : 
                               'Featured'}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="post-card-content">
                        <p className="post-excerpt">
                          {expandedPosts[post.id] 
                            ? post.excerpt 
                            : truncateExcerpt(post.excerpt || '', 150)
                          }
                        </p>
                        
                        <div className="post-card-actions">
                          {post.excerpt && post.excerpt.length > 150 && (
                            <button 
                              className="expand-btn"
                              onClick={() => togglePostExpansion(post.id)}
                            >
                              {expandedPosts[post.id] ? 
                                (currentLanguage === 'al' ? 'Më pak' : currentLanguage === 'it' ? 'Meno' : 'Less') :
                                (currentLanguage === 'al' ? 'Më shumë' : currentLanguage === 'it' ? 'Di più' : 'More')
                              }
                            </button>
                          )}
                          
                          <button 
                            className="read-full-btn"
                            onClick={() => {
                              setSelectedPost(post);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                          >
                            {currentLanguage === 'al' ? 'Lexo Artikullin e Plotë' : 
                             currentLanguage === 'it' ? 'Leggi Articolo Completo' : 
                             'Read Full Article'}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </>
          )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Blog;