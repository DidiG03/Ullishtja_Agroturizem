// Vercel Serverless Function for Blog Categories API
// Handles GET and POST requests for blog categories

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
      // Get all blog categories
      const categories = await prisma.blogCategory.findMany({
        include: {
          _count: {
            select: {
              posts: {
                where: {
                  isPublished: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      });

      // Transform the data to include post count and default name
      const transformedCategories = categories.map(category => ({
        id: category.id,
        name: category.nameAL, // Default to Albanian
        nameAL: category.nameAL,
        nameEN: category.nameEN,
        nameIT: category.nameIT,
        slug: category.slug,
        descriptionAL: category.descriptionAL,
        descriptionEN: category.descriptionEN,
        descriptionIT: category.descriptionIT,
        postCount: category._count.posts,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt
      }));

      return res.status(200).json({
        success: true,
        data: transformedCategories
      });

    } else if (req.method === 'POST') {
      // Create new blog category
      const {
        slug,
        nameAL,
        nameEN,
        nameIT,
        descriptionAL,
        descriptionEN,
        descriptionIT
      } = req.body;

      // Validate required fields
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
        return res.status(400).json({
          success: false,
          error: 'Slug already exists'
        });
      }

      // Create the blog category
      const newCategory = await prisma.blogCategory.create({
        data: {
          slug,
          nameAL,
          nameEN,
          nameIT,
          descriptionAL,
          descriptionEN,
          descriptionIT
        }
      });

      return res.status(201).json({
        success: true,
        data: newCategory
      });

    } else {
      // Method not allowed
      return res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }

  } catch (error) {
    console.error('Blog categories API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  } finally {
    await prisma.$disconnect();
  }
}