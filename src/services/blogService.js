// Blog Service
// Frontend service for blog operations

import apiClient from '../utils/apiClient.js';
import {
  findEmbeddedDataUrls,
  replaceEmbeddedImagesInHtml,
  estimateJsonBytes,
} from '../utils/blogEmbeddedImages.js';

const MAX_POST_PAYLOAD_BYTES = 4 * 1024 * 1024;

async function parseApiResponse(response) {
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  return { data, text, ok: response.ok, status: response.status };
}

function apiErrorMessage(parsed, fallback) {
  if (parsed.status === 413) {
    return 'Post is too large to save. Wait for embedded images to upload, or use “Image URL” instead of uploading files into the editor.';
  }
  if (parsed.data?.error) return parsed.data.error;
  if (parsed.text?.startsWith('Request Entity')) {
    return 'Post is too large to save. Use hosted image URLs (e.g. https://ucarecdn.com/…) instead of pasting large images into the editor.';
  }
  if (parsed.text && parsed.text.length < 200) return parsed.text;
  return fallback;
}

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
    if (options.admin) params.append('admin', 'true');
    if (category) params.append('category', category);
    if (featured !== undefined) params.append('featured', featured);
    if (limit) params.append('limit', limit);
    if (offset) params.append('offset', offset);
    if (search) params.append('search', search);
    if (language) params.append('language', language);

    try {
      return await apiClient.get('/api/blog', Object.fromEntries(params));
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      throw error;
    }
  }

  async getPost(id, language = 'al') {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/blog?id=${id}&language=${language}`);
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

  async getPostForEdit(id) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/blog?id=${id}&admin=true`);
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch post');
      }
      return result.data[0] || null;
    } catch (error) {
      console.error('Error fetching blog post for edit:', error);
      throw error;
    }
  }

  async uploadDataUrl(dataUrl, options = {}) {
    const response = await fetch(`${this.apiBaseUrl}/api/blog/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl, ...options }),
    });
    const parsed = await parseApiResponse(response);
    if (!parsed.ok) {
      throw new Error(apiErrorMessage(parsed, 'Failed to upload image'));
    }
    return parsed.data;
  }

  async uploadHostedUrl(dataUrl) {
    const result = await this.uploadDataUrl(dataUrl);
    const url = result?.data?.url;
    if (!url) throw new Error('Upload did not return an image URL');
    return url;
  }

  /** Upload inline base64 images so the save payload stays under Vercel limits */
  async preparePostForSave(form, blogPostId) {
    const next = { ...form };
    const uploadOne = async (dataUrl) => this.uploadHostedUrl(dataUrl);

    const contentFields = ['contentAL', 'contentEN', 'contentIT'];
    for (const field of contentFields) {
      if (next[field]?.includes('data:image')) {
        next[field] = await replaceEmbeddedImagesInHtml(next[field], uploadOne);
      }
    }

    if (next.featuredImageUrl?.startsWith('data:image')) {
      next.featuredImageUrl = await uploadOne(next.featuredImageUrl);
    }

    const remaining = [
      ...findEmbeddedDataUrls(next.contentAL),
      ...findEmbeddedDataUrls(next.contentEN),
      ...findEmbeddedDataUrls(next.contentIT),
    ];
    if (remaining.length > 0) {
      throw new Error(
        'Some images could not be uploaded. Use “Image URL” with a hosted link, or connect Vercel Blob storage.'
      );
    }

    const bytes = estimateJsonBytes(next);
    if (bytes > MAX_POST_PAYLOAD_BYTES) {
      throw new Error(
        `Post is still too large (${Math.round(bytes / 1024 / 1024)}MB). Remove duplicate images or use smaller hosted URLs.`
      );
    }

    return next;
  }

  async createPost(postData) {
    try {
      const prepared = await this.preparePostForSave(postData);
      const response = await fetch(`${this.apiBaseUrl}/api/blog`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(prepared),
      });

      const parsed = await parseApiResponse(response);
      if (!parsed.ok) {
        throw new Error(apiErrorMessage(parsed, 'Failed to create post'));
      }

      return parsed.data;
    } catch (error) {
      console.error('Error creating blog post:', error);
      throw error;
    }
  }

  async updatePost(id, postData) {
    try {
      const prepared = await this.preparePostForSave(postData, id);
      const response = await fetch(`${this.apiBaseUrl}/api/blog?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(prepared),
      });

      const parsed = await parseApiResponse(response);
      if (!parsed.ok) {
        throw new Error(apiErrorMessage(parsed, 'Failed to update post'));
      }

      return parsed.data;
    } catch (error) {
      console.error('Error updating blog post:', error);
      throw error;
    }
  }

  async deletePost(id) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/blog?id=${id}`, {
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
    params.append('resource', 'categories');
    if (active !== undefined) params.append('active', active);
    if (language) params.append('language', language);
    if (includePosts) params.append('includePosts', includePosts);

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/blog?${params}`);
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
      const response = await fetch(`${this.apiBaseUrl}/api/blog?resource=categories`, {
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
      const response = await fetch(`${this.apiBaseUrl}/api/blog?resource=categories&id=${id}`, {
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
      const response = await fetch(`${this.apiBaseUrl}/api/blog?resource=categories&id=${id}`, {
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
        body: formData,
      });

      const parsed = await parseApiResponse(response);
      if (!parsed.ok) {
        throw new Error(apiErrorMessage(parsed, 'Failed to upload image'));
      }

      return parsed.data;
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
    const hasContent = (html) => html && html.replace(/<[^>]*>/g, '').trim().length > 0;

    if (!postData.titleAL?.trim()) errors.push('Albanian title is required');
    if (!hasContent(postData.contentAL)) errors.push('Albanian content is required');
    if (!postData.categoryId) errors.push('Category is required');
    if (!postData.slug?.trim()) errors.push('Slug is required');

    return {
      isValid: errors.length === 0,
      errors,
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