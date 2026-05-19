// Blog Management Component
// Dashboard interface for managing blog posts and categories

import React, { useState, useEffect, useCallback } from 'react';
import blogService from '../services/blogService';
import BlogPostEditor from './blog/BlogPostEditor';
import './BlogManagement.css';

const BlogManagement = () => {
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' or 'categories'
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [view, setView] = useState('list'); // 'list' | 'editor'
  const [editingPost, setEditingPost] = useState(null);
  const [editorLoading, setEditorLoading] = useState(false);

  // Category management state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    nameAL: '',
    nameEN: '',
    nameIT: '',
    slug: '',
    descriptionAL: '',
    descriptionEN: '',
    descriptionIT: '',
    displayOrder: 0,
    isActive: true
  });

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPublished, setFilterPublished] = useState('');

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [postsResult, categoriesResult] = await Promise.all([
        blogService.getPosts({ language: 'al', published: 'all' }),
        blogService.getCategories({ language: 'al', includePosts: true })
      ]);

      setPosts(postsResult.data || []);
      setCategories(categoriesResult.data || []);
    } catch (err) {
      setError('Failed to load data: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Clear messages
  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  // Post management functions
  const handleCreatePost = () => {
    setEditingPost(null);
    setView('editor');
    clearMessages();
  };

  const handleEditPost = async (post) => {
    try {
      setEditorLoading(true);
      clearMessages();
      const fullPost = await blogService.getPostForEdit(post.id);
      setEditingPost(fullPost);
      setView('editor');
    } catch (err) {
      setError('Failed to load post: ' + err.message);
    } finally {
      setEditorLoading(false);
    }
  };

  const handleSavePost = async (postForm, publish) => {
    try {
      setLoading(true);
      clearMessages();

      const payload = {
        ...postForm,
        isPublished: publish ? true : postForm.isPublished,
      };

      if (editingPost?.id) {
        await blogService.updatePost(editingPost.id, payload);
        setSuccess(publish ? 'Post published successfully' : 'Post saved successfully');
      } else {
        await blogService.createPost(payload);
        setSuccess(publish ? 'Post published successfully' : 'Draft created successfully');
      }

      setView('list');
      setEditingPost(null);
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseEditor = () => {
    if (!window.confirm('Leave editor? Unsaved changes may remain in your browser draft.')) {
      return;
    }
    setView('list');
    setEditingPost(null);
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      setLoading(true);
      await blogService.deletePost(postId);
      setSuccess('Post deleted successfully');
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Category management functions
  const handleCreateCategory = () => {
    setEditingCategory(null);
    setCategoryForm({
      nameAL: '',
      nameEN: '',
      nameIT: '',
      slug: '',
      descriptionAL: '',
      descriptionEN: '',
      descriptionIT: '',
      displayOrder: 0,
      isActive: true
    });
    setShowCategoryModal(true);
    clearMessages();
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      nameAL: category.nameAL || '',
      nameEN: category.nameEN || '',
      nameIT: category.nameIT || '',
      slug: category.slug,
      descriptionAL: category.descriptionAL || '',
      descriptionEN: category.descriptionEN || '',
      descriptionIT: category.descriptionIT || '',
      displayOrder: category.displayOrder,
      isActive: category.isActive
    });
    setShowCategoryModal(true);
    clearMessages();
  };

  const handleSaveCategory = async () => {
    try {
      setLoading(true);
      clearMessages();

      // Validate form
      const validation = blogService.validateCategoryData(categoryForm);
      if (!validation.isValid) {
        setError(validation.errors.join(', '));
        return;
      }

      if (editingCategory) {
        await blogService.updateCategory(editingCategory.id, categoryForm);
        setSuccess('Category updated successfully');
      } else {
        await blogService.createCategory(categoryForm);
        setSuccess('Category created successfully');
      }

      setShowCategoryModal(false);
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return;
    }

    try {
      setLoading(true);
      await blogService.deleteCategory(categoryId);
      setSuccess('Category deleted successfully');
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate slug from title
  const handleCategoryNameChange = (value) => {
    setCategoryForm({
      ...categoryForm,
      nameAL: value,
      slug: value ? blogService.generateSlug(value) : categoryForm.slug,
    });
  };

  // Filter posts
  const filteredPosts = posts.filter(post => {
    const matchesSearch = !searchTerm || 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !filterCategory || post.category.id === filterCategory;
    
    const matchesPublished = filterPublished === '' || 
      (filterPublished === 'true' && post.isPublished) ||
      (filterPublished === 'false' && !post.isPublished);

    return matchesSearch && matchesCategory && matchesPublished;
  });

  if (view === 'editor') {
    return (
      <div className="blog-management blog-management--editor">
        {error && (
          <div className="message error">
            {error}
            <button type="button" onClick={clearMessages}>×</button>
          </div>
        )}
        {success && (
          <div className="message success">
            {success}
            <button type="button" onClick={clearMessages}>×</button>
          </div>
        )}
        <BlogPostEditor
          post={editingPost}
          categories={categories}
          onSave={handleSavePost}
          onCancel={handleCloseEditor}
          saving={loading || editorLoading}
        />
      </div>
    );
  }

  return (
    <div className="blog-management">
      <div className="blog-management-header">
        <h2>Blog Management</h2>
        
        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            Posts ({posts.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            Categories ({categories.length})
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="message error">
          {error}
          <button onClick={clearMessages}>×</button>
        </div>
      )}
      {success && (
        <div className="message success">
          {success}
          <button onClick={clearMessages}>×</button>
        </div>
      )}

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div className="posts-section">
          <div className="section-header">
            <div className="filters">
              <input
                type="text"
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="filter-select"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <select
                value={filterPublished}
                onChange={(e) => setFilterPublished(e.target.value)}
                className="filter-select"
              >
                <option value="">All Status</option>
                <option value="true">Published</option>
                <option value="false">Draft</option>
              </select>
            </div>
            <button 
              className="btn btn-primary"
              onClick={handleCreatePost}
              disabled={loading}
            >
              + New Post
            </button>
          </div>

          <div className="posts-grid">
            {filteredPosts.map(post => (
              <div key={post.id} className="post-card">
                {post.featuredImageUrl && (
                  <img 
                    src={post.featuredImageUrl} 
                    alt={post.featuredImageAlt || post.title}
                    className="post-card-image"
                  />
                )}
                <div className="post-card-content">
                  <h3 className="post-card-title">{post.title}</h3>
                  <p className="post-card-excerpt">{post.excerpt}</p>
                  <div className="post-card-meta">
                    <span className="category-tag">{post.category.name}</span>
                    <span className={`status-tag ${post.isPublished ? 'published' : 'draft'}`}>
                      {post.isPublished ? 'Published' : 'Draft'}
                    </span>
                    {post.isFeatured && <span className="featured-tag">Featured</span>}
                  </div>
                  <div className="post-card-stats">
                    <span>Views: {post.viewCount}</span>
                    <span>Created: {new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="post-card-actions">
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleEditPost(post)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeletePost(post.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredPosts.length === 0 && !loading && (
            <div className="empty-state">
              <p>No posts found. {posts.length === 0 ? 'Create your first post!' : 'Try adjusting your filters.'}</p>
            </div>
          )}
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="categories-section">
          <div className="section-header">
            <h3>Blog Categories</h3>
            <button 
              className="btn btn-primary"
              onClick={handleCreateCategory}
              disabled={loading}
            >
              + New Category
            </button>
          </div>

          <div className="categories-list">
            {categories.map(category => (
              <div key={category.id} className="category-item">
                <div className="category-info">
                  <h4>{category.name}</h4>
                  <p>{category.description}</p>
                  <div className="category-meta">
                    <span>Slug: {category.slug}</span>
                    <span>Posts: {category.postCount}</span>
                    <span className={`status-tag ${category.isActive ? 'active' : 'inactive'}`}>
                      {category.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="category-actions">
                  <button 
                    className="btn btn-sm btn-secondary"
                    onClick={() => handleEditCategory(category)}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDeleteCategory(category.id)}
                    disabled={category.postCount > 0}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {categories.length === 0 && !loading && (
            <div className="empty-state">
              <p>No categories found. Create your first category!</p>
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingCategory ? 'Edit Category' : 'Create New Category'}</h3>
              <button className="modal-close" onClick={() => setShowCategoryModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Albanian Name *</label>
                <input
                  type="text"
                  value={categoryForm.nameAL}
                  onChange={(e) => handleCategoryNameChange(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>English Name *</label>
                <input
                  type="text"
                  value={categoryForm.nameEN}
                  onChange={(e) => setCategoryForm({...categoryForm, nameEN: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Italian Name *</label>
                <input
                  type="text"
                  value={categoryForm.nameIT}
                  onChange={(e) => setCategoryForm({...categoryForm, nameIT: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>URL Slug *</label>
                <input
                  type="text"
                  value={categoryForm.slug}
                  onChange={(e) => setCategoryForm({...categoryForm, slug: e.target.value})}
                  placeholder="url-friendly-slug"
                  required
                />
              </div>

              <div className="form-group">
                <label>Display Order</label>
                <input
                  type="number"
                  value={categoryForm.displayOrder}
                  onChange={(e) => setCategoryForm({...categoryForm, displayOrder: parseInt(e.target.value) || 0})}
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={categoryForm.isActive}
                    onChange={(e) => setCategoryForm({...categoryForm, isActive: e.target.checked})}
                  />
                  Active
                </label>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowCategoryModal(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleSaveCategory}
                disabled={loading}
              >
                {loading ? 'Saving...' : (editingCategory ? 'Update Category' : 'Create Category')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogManagement;