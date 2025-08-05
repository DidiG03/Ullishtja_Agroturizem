// Vercel Serverless Function for Blog Posts API
// Handles GET and POST requests for blog posts

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Get all blog posts
      const { category, featured, published = 'true' } = req.query;

      let whereClause = {};

      // Filter by publication status (default to published posts only)
      if (published === 'true') {
        whereClause.isPublished = true;
      } else if (published === 'false') {
        whereClause.isPublished = false;
      }
      // If published is 'all', don't filter by publication status

      // Filter by category if specified
      if (category && category !== 'all') {
        whereClause.category = {
          slug: category
        };
      }

      // Filter by featured status if specified
      if (featured !== undefined) {
        whereClause.isFeatured = featured === 'true';
      }

      const posts = await prisma.blogPost.findMany({
        where: whereClause,
        include: {
          category: {
            select: {
              id: true,
              nameAL: true,
              nameEN: true,
              nameIT: true,
              slug: true
            }
          }
        },
        orderBy: [
          { isFeatured: 'desc' },
          { publishedAt: 'desc' },
          { createdAt: 'desc' }
        ]
      });

      // Transform the data to include category name and other computed fields
      const transformedPosts = posts.map(post => ({
        id: post.id,
        titleAL: post.titleAL,
        titleEN: post.titleEN,
        titleIT: post.titleIT,
        excerptAL: post.excerptAL,
        excerptEN: post.excerptEN,
        excerptIT: post.excerptIT,
        contentAL: post.contentAL,
        contentEN: post.contentEN,
        contentIT: post.contentIT,
        slug: post.slug,
        featuredImageUrl: post.featuredImageUrl,
        featuredImageAlt: post.featuredImageAlt,
        author: post.author,
        isFeatured: post.isFeatured,
        isPublished: post.isPublished,
        publishedAt: post.publishedAt,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        metaDescription: post.metaDescription,
        metaKeywords: post.metaKeywords,
        category: {
          id: post.category.id,
          name: post.category.nameAL, // Default to Albanian
          nameAL: post.category.nameAL,
          nameEN: post.category.nameEN,
          nameIT: post.category.nameIT,
          slug: post.category.slug
        }
      }));

      return res.status(200).json({
        success: true,
        data: transformedPosts
      });

    } else if (req.method === 'POST') {
      // Create new blog post
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
        featuredImageUrl,
        featuredImageAlt,
        author,
        isFeatured = false,
        isPublished = false,
        metaDescription,
        metaKeywords
      } = req.body;

      // Validate required fields
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
        return res.status(400).json({
          success: false,
          error: 'Slug already exists'
        });
      }

      // Create the blog post
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
          featuredImageUrl,
          featuredImageAlt,
          author,
          isFeatured,
          isPublished,
          publishedAt: isPublished ? new Date() : null,
          metaDescription,
          metaKeywords
        },
        include: {
          category: {
            select: {
              id: true,
              nameAL: true,
              nameEN: true,
              nameIT: true,
              slug: true
            }
          }
        }
      });

      return res.status(201).json({
        success: true,
        data: newPost
      });

    } else {
      // Method not allowed
      return res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }

  } catch (error) {
    console.error('Blog posts API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  } finally {
    await prisma.$disconnect();
  }
}