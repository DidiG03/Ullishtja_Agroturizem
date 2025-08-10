// Blog Service
// Frontend service for blog operations

import apiClient from '../utils/apiClient.js';

class BlogService {
  constructor() {
    // API base URL now handled by centralized client
    // Keep a local reference for places still using fetch directly
    this.apiBaseUrl = apiClient.baseUrl;
  }

  // Blog Posts API calls

  async getPosts(options = {}) {
    const {
      published,
      category,
      featured,
      limit,
      offset,
      search,
      language = 'al'
    } = options;

    const params = new URLSearchParams();
    if (published !== undefined) params.append('published', published);
    if (category) params.append('category', category);
    if (featured !== undefined) params.append('featured', featured);
    if (limit) params.append('limit', limit);
    if (offset) params.append('offset', offset);
    if (search) params.append('search', search);
    if (language) params.append('language', language);

    try {
      return await apiClient.get('/api/blog/posts', Object.fromEntries(params));
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      throw error;
    }
  }

  async getPost(id, language = 'al') {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/blog/posts?id=${id}&language=${language}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch post');
      }

      return result.data[0] || null;
    } catch (error) {
      console.error('Error fetching blog post:', error);
      throw error;
    }
  }

  async createPost(postData) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/blog/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create post');
      }

      return result;
    } catch (error) {
      console.error('Error creating blog post:', error);
      throw error;
    }
  }

  async updatePost(id, postData) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/blog/posts?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update post');
      }

      return result;
    } catch (error) {
      console.error('Error updating blog post:', error);
      throw error;
    }
  }

  async deletePost(id) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/blog/posts?id=${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete post');
      }

      return result;
    } catch (error) {
      console.error('Error deleting blog post:', error);
      throw error;
    }
  }

  // Blog Categories API calls

  async getCategories(options = {}) {
    const {
      active,
      language = 'al',
      includePosts = false
    } = options;

    const params = new URLSearchParams();
    if (active !== undefined) params.append('active', active);
    if (language) params.append('language', language);
    if (includePosts) params.append('includePosts', includePosts);

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/blog/categories?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch categories');
      }

      return result;
    } catch (error) {
      console.error('Error fetching blog categories:', error);
      throw error;
    }
  }

  async createCategory(categoryData) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/blog/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create category');
      }

      return result;
    } catch (error) {
      console.error('Error creating blog category:', error);
      throw error;
    }
  }

  async updateCategory(id, categoryData) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/blog/categories?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update category');
      }

      return result;
    } catch (error) {
      console.error('Error updating blog category:', error);
      throw error;
    }
  }

  async deleteCategory(id) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/blog/categories?id=${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete category');
      }

      return result;
    } catch (error) {
      console.error('Error deleting blog category:', error);
      throw error;
    }
  }

  // Image Upload API calls

  async uploadImage(file, options = {}) {
    const { blogPostId, title, altText } = options;

    const formData = new FormData();
    formData.append('image', file);
    if (blogPostId) formData.append('blogPostId', blogPostId);
    if (title) formData.append('title', title);
    if (altText) formData.append('altText', altText);

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/blog/upload`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload image');
      }

      return result;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  async deleteImage(imageId) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/blog/upload?imageId=${imageId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete image');
      }

      return result;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }

  async deleteImageByFilename(filename) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/blog/upload?filename=${filename}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete image');
      }

      return result;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }

  // Utility methods

  generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim('-'); // Remove leading/trailing hyphens
  }

  validatePostData(postData) {
    const errors = [];

    if (!postData.titleAL) errors.push('Albanian title is required');
    if (!postData.titleEN) errors.push('English title is required');
    if (!postData.titleIT) errors.push('Italian title is required');
    if (!postData.contentAL) errors.push('Albanian content is required');
    if (!postData.contentEN) errors.push('English content is required');
    if (!postData.contentIT) errors.push('Italian content is required');
    if (!postData.categoryId) errors.push('Category is required');
    if (!postData.slug) errors.push('Slug is required');

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateCategoryData(categoryData) {
    const errors = [];

    if (!categoryData.nameAL) errors.push('Albanian name is required');
    if (!categoryData.nameEN) errors.push('English name is required');
    if (!categoryData.nameIT) errors.push('Italian name is required');
    if (!categoryData.slug) errors.push('Slug is required');

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

const blogService = new BlogService();
export default blogService;