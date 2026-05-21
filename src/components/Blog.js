import React, { useState, useEffect, useMemo } from 'react';
import './Blog.css';
import './blog/blogContentImages.css';
import { translations } from '../translations';
import SEOHead from './SEOHead';
import Layout from './Layout';
import blogService from '../services/blogService';
import { normalizeContentHtml } from './blog/blogImageUtils';
import BlogPostCard from './blog/BlogPostCard';
import { useNavigate, useParams } from 'react-router-dom';

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
  const navigate = useNavigate();
  const { slug } = useParams();
  const [currentLanguage, setCurrentLanguage] = useState(propLanguage || getInitialLanguage());
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // New state for database data
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const t = translations[currentLanguage] || translations.al;

  const buildBlogPath = (postSlug = null, lang = currentLanguage) => {
    const basePath = postSlug ? `/blog/${postSlug}` : '/blog';
    return lang === 'al' ? basePath : `${basePath}?lang=${lang}`;
  };

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
    const handleLanguageChanged = (event) => {
      const lang = event.detail?.language;
      if (lang && lang !== currentLanguage) {
        setCurrentLanguage(lang);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('languageChanged', handleLanguageChanged);
    
    // Also check for prop changes
    if (propLanguage && propLanguage !== currentLanguage) {
      setCurrentLanguage(propLanguage);
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('languageChanged', handleLanguageChanged);
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

  // Render post content with HTML (strip pasted white backgrounds from Word/Docs)
  const renderContent = (content) => {
    const html = normalizeContentHtml(content);
    return <div className="blog-article-body" dangerouslySetInnerHTML={{ __html: html }} />;
  };

  // Get related posts (exclude current post and same category)
  const getRelatedPosts = (currentPost) => {
    return posts
      .filter(post => post.id !== currentPost.id)
      .slice(0, 3);
  };

  const openPost = (post) => {
    setSelectedPost(post);
    navigate(buildBlogPath(post.slug), { replace: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle back to blog from single post view
  const handleBackToBlog = () => {
    setSelectedPost(null);
    navigate(buildBlogPath(null), { replace: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sync route /blog/:slug <-> selected post
  useEffect(() => {
    if (loading) return;

    if (slug) {
      const matchedPost = posts.find((post) => post.slug === slug);
      if (matchedPost) {
        setSelectedPost(matchedPost);
      } else {
        setSelectedPost(null);
      }
      return;
    }

    setSelectedPost(null);
  }, [slug, posts, loading]);



  // Single post view
  if (selectedPost) {
    const relatedPosts = getRelatedPosts(selectedPost);
    
    return (
      <Layout currentLanguage={currentLanguage}>
        <div className="blog-container">
          <SEOHead 
            currentLanguage={currentLanguage}
            pageSection="blog"
            customTitle={`${selectedPost.title} | ${t.blog.title} | Ullishtja Agroturizem`}
            customDescription={selectedPost.excerpt || t.blog.subtitle}
            customKeywords={`${selectedPost.title}, ${selectedPost.category?.name || 'blog'}, ullishtja agroturizem, ${currentLanguage === 'al' ? 'restorant shqiptar' : currentLanguage === 'it' ? 'ristorante albanese' : 'albanian restaurant'}`}
            customImage={selectedPost.featuredImageUrl || undefined}
            blogPost={{
              title: selectedPost.title,
              publishedAt: selectedPost.publishedAt || selectedPost.publishDate,
              updatedAt: selectedPost.updatedAt,
              categoryName: selectedPost.category?.name || 'Blog',
            }}
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
                <p className="blog-title" style={{ margin: 0 }}>{t.blog.title}</p>
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
                  {selectedPost.category?.name || selectedPost.category?.nameAL || 'Blog'}
                </span>
              </div>
            </header>
            
            <div className="post-content">
              {renderContent(selectedPost.content)}
            </div>

            {relatedPosts.length > 0 && (
              <section className="related-posts">
                <h3>{t.blog.relatedPosts}</h3>
                <div className="blog-posts-grid related-posts-grid">
                  {relatedPosts.map((post) => (
                    <BlogPostCard
                      key={post.id}
                      post={post}
                      currentLanguage={currentLanguage}
                      formatDate={formatDate}
                      onRead={openPost}
                    />
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
  const hasNoPublishedPosts = !loading && !error && posts.length === 0;

  return (
    <Layout currentLanguage={currentLanguage}>
      <div className="blog-container">
        <SEOHead 
          currentLanguage={currentLanguage}
          pageSection="blog"
          customTitle={`${t.blog.title} - ${currentLanguage === 'al' ? 'Ullishtja Agroturizem' : currentLanguage === 'it' ? 'Ullishtja Agriturismo' : 'Ullishtja Agritourism'}`}
          customDescription={t.blog.subtitle}
          customKeywords={`blog agriturismo, agricultura organike, kuzhina tradicionale, ${currentLanguage === 'al' ? 'Ullishtja blog' : currentLanguage === 'it' ? 'blog Ullishtja' : 'Ullishtja blog'}, sustainable farming, traditional recipes`}
          customRobots={hasNoPublishedPosts ? 'noindex, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' : null}
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
                  filteredPosts.map((post) => (
                    <BlogPostCard
                      key={post.id}
                      post={post}
                      currentLanguage={currentLanguage}
                      formatDate={formatDate}
                      onRead={openPost}
                    />
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