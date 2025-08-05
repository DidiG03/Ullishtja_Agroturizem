// Blog API Routes for Express
// Handles both blog posts and categories

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'public', 'images', 'blog');
    
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const basename = path.basename(file.originalname, extension);
    const sanitizedBasename = basename.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    
    cb(null, `${sanitizedBasename}-${uniqueSuffix}${extension}`);
  }
});

// File filter for image types
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// GET /api/blog/posts - Get blog posts
router.get('/posts', async (req, res) => {
  try {
    const { 
      published, 
      category, 
      featured, 
      limit, 
      offset, 
      search,
      language = 'al'
    } = req.query;

    const where = {};

    // Filter by published status
    if (published !== undefined) {
      where.isPublished = published === 'true';
    }

    // Filter by category
    if (category) {
      where.category = {
        slug: category
      };
    }

    // Filter by featured status
    if (featured !== undefined) {
      where.isFeatured = featured === 'true';
    }

    // Search functionality
    if (search) {
      where.OR = [
        { titleAL: { contains: search, mode: 'insensitive' } },
        { titleEN: { contains: search, mode: 'insensitive' } },
        { titleIT: { contains: search, mode: 'insensitive' } },
        { excerptAL: { contains: search, mode: 'insensitive' } },
        { excerptEN: { contains: search, mode: 'insensitive' } },
        { excerptIT: { contains: search, mode: 'insensitive' } }
      ];
    }

    const posts = await prisma.blogPost.findMany({
      where,
      include: {
        category: true,
        images: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' }
        }
      },
      orderBy: [
        { isFeatured: 'desc' },
        { displayOrder: 'asc' },
        { publishedAt: 'desc' }
      ],
      skip: offset ? parseInt(offset) : 0,
      take: limit ? parseInt(limit) : undefined
    });

    // Transform for frontend consumption
    const transformedPosts = posts.map(post => ({
      id: post.id,
      slug: post.slug,
      title: post[`title${language.toUpperCase()}`] || post.titleAL,
      excerpt: post[`excerpt${language.toUpperCase()}`] || post.excerptAL,
      content: post[`content${language.toUpperCase()}`] || post.contentAL,
      metaDescription: post[`metaDescription${language.toUpperCase()}`] || post.metaDescriptionAL,
      metaKeywords: post[`metaKeywords${language.toUpperCase()}`] || post.metaKeywordsAL,
      featuredImageUrl: post.featuredImageUrl,
      featuredImageAlt: post.featuredImageAlt,
      isPublished: post.isPublished,
      isFeatured: post.isFeatured,
      viewCount: post.viewCount,
      authorName: post.authorName,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      category: {
        id: post.category.id,
        name: post.category[`name${language.toUpperCase()}`] || post.category.nameAL,
        slug: post.category.slug
      },
      images: post.images
    }));

    // Get total count for pagination
    const totalCount = await prisma.blogPost.count({ where });

    res.json({
      success: true,
      data: transformedPosts,
      pagination: {
        total: totalCount,
        limit: limit ? parseInt(limit) : totalCount,
        offset: offset ? parseInt(offset) : 0
      }
    });

  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// POST /api/blog/posts - Create new blog post
router.post('/posts', async (req, res) => {
  try {
    const {
      categoryId,
      slug,
      titleAL,
      titleEN,
      titleIT,
      excerptAL,
      excerptEN,
      excerptIT,
      contentAL,
      contentEN,
      contentIT,
      metaDescriptionAL,
      metaDescriptionEN,
      metaDescriptionIT,
      metaKeywordsAL,
      metaKeywordsEN,
      metaKeywordsIT,
      featuredImageUrl,
      featuredImageAlt,
      isPublished = false,
      isFeatured = false,
      displayOrder = 0,
      authorName = 'Ullishtja Agroturizem'
    } = req.body;

    // Validation
    if (!categoryId || !slug || !titleAL || !titleEN || !titleIT || !contentAL || !contentEN || !contentIT) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['categoryId', 'slug', 'titleAL', 'titleEN', 'titleIT', 'contentAL', 'contentEN', 'contentIT']
      });
    }

    // Check if slug already exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { slug }
    });

    if (existingPost) {
      return res.status(409).json({
        success: false,
        error: 'Slug already exists'
      });
    }

    // Verify category exists
    const category = await prisma.blogCategory.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    const newPost = await prisma.blogPost.create({
      data: {
        categoryId,
        slug,
        titleAL,
        titleEN,
        titleIT,
        excerptAL,
        excerptEN,
        excerptIT,
        contentAL,
        contentEN,
        contentIT,
        metaDescriptionAL,
        metaDescriptionEN,
        metaDescriptionIT,
        metaKeywordsAL,
        metaKeywordsEN,
        metaKeywordsIT,
        featuredImageUrl,
        featuredImageAlt,
        isPublished,
        isFeatured,
        displayOrder,
        authorName,
        publishedAt: isPublished ? new Date() : null
      },
      include: {
        category: true,
        images: true
      }
    });

    res.status(201).json({
      success: true,
      data: newPost,
      message: 'Blog post created successfully'
    });

  } catch (error) {
    console.error('Error creating blog post:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: 'Slug already exists'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// GET /api/blog/categories - Get blog categories
router.get('/categories', async (req, res) => {
  try {
    const { 
      active, 
      language = 'al',
      includePosts = 'false'
    } = req.query;

    const where = {};

    // Filter by active status
    if (active !== undefined) {
      where.isActive = active === 'true';
    }

    const include = {};
    if (includePosts === 'true') {
      include.blogPosts = {
        where: { isPublished: true },
        orderBy: { publishedAt: 'desc' },
        take: 5 // Limit posts per category
      };
      include._count = {
        select: { blogPosts: { where: { isPublished: true } } }
      };
    }

    const categories = await prisma.blogCategory.findMany({
      where,
      include,
      orderBy: { displayOrder: 'asc' }
    });

    // Transform for frontend consumption
    const transformedCategories = categories.map(category => ({
      id: category.id,
      name: category[`name${language.toUpperCase()}`] || category.nameAL,
      slug: category.slug,
      description: category[`description${language.toUpperCase()}`] || category.descriptionAL,
      displayOrder: category.displayOrder,
      isActive: category.isActive,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      postCount: category._count?.blogPosts || 0,
      recentPosts: category.blogPosts || []
    }));

    res.json({
      success: true,
      data: transformedCategories
    });

  } catch (error) {
    console.error('Error fetching blog categories:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// POST /api/blog/categories - Create new blog category
router.post('/categories', async (req, res) => {
  try {
    const {
      nameAL,
      nameEN,
      nameIT,
      slug,
      descriptionAL,
      descriptionEN,
      descriptionIT,
      displayOrder = 0,
      isActive = true
    } = req.body;

    // Validation
    if (!nameAL || !nameEN || !nameIT || !slug) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['nameAL', 'nameEN', 'nameIT', 'slug']
      });
    }

    // Check if slug already exists
    const existingCategory = await prisma.blogCategory.findUnique({
      where: { slug }
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        error: 'Slug already exists'
      });
    }

    const newCategory = await prisma.blogCategory.create({
      data: {
        nameAL,
        nameEN,
        nameIT,
        slug,
        descriptionAL,
        descriptionEN,
        descriptionIT,
        displayOrder,
        isActive
      }
    });

    res.status(201).json({
      success: true,
      data: newCategory,
      message: 'Blog category created successfully'
    });

  } catch (error) {
    console.error('Error creating blog category:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: 'Slug already exists'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// POST /api/blog/upload - Handle image uploads
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const { blogPostId, title, altText } = req.body;
    
    // Generate image URL
    const imageUrl = `/images/blog/${req.file.filename}`;
    
    // Create blog image record if blogPostId is provided
    let blogImage = null;
    if (blogPostId) {
      // Verify blog post exists
      const blogPost = await prisma.blogPost.findUnique({
        where: { id: blogPostId }
      });

      if (!blogPost) {
        // Delete uploaded file if blog post doesn't exist
        fs.unlinkSync(req.file.path);
        return res.status(404).json({
          success: false,
          error: 'Blog post not found'
        });
      }

      blogImage = await prisma.blogImage.create({
        data: {
          blogPostId,
          title: title || req.file.originalname,
          altText: altText || '',
          imageUrl
        }
      });
    }

    res.json({
      success: true,
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        url: imageUrl,
        blogImage: blogImage
      },
      message: 'Image uploaded successfully'
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    // Delete uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Cleanup on module unload
process.on('exit', async () => {
  await prisma.$disconnect();
});

module.exports = router;