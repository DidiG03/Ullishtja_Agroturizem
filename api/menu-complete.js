// Consolidated Menu API - All menu operations in one function
// Handles categories, items, and complete menu data

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

  const { path } = req.query;

  try {
    // Route based on path parameter
    if (!path || path.length === 0) {
      // GET /api/menu-complete - Complete menu with categories and items
      if (req.method === 'GET') {
        const categories = await prisma.category.findMany({
          include: {
            menuItems: {
              orderBy: { name: 'asc' }
            }
          },
          orderBy: { name: 'asc' }
        });

        return res.status(200).json({
          success: true,
          data: categories
        });
      }
    } else if (path[0] === 'categories') {
      // Categories operations
      if (path.length === 1) {
        // GET /api/menu-complete?path=categories - Get all categories
        if (req.method === 'GET') {
          const categories = await prisma.category.findMany({
            orderBy: { name: 'asc' }
          });

          return res.status(200).json({
            success: true,
            data: categories
          });
        }
        // POST /api/menu-complete?path=categories - Create category
        else if (req.method === 'POST') {
          const { name, description } = req.body;

          if (!name) {
            return res.status(400).json({
              success: false,
              error: 'Category name is required'
            });
          }

          const category = await prisma.category.create({
            data: { name, description }
          });

          return res.status(201).json({
            success: true,
            data: category
          });
        }
      } else if (path.length === 2) {
        // Operations on specific category by ID
        const categoryId = path[1];

        if (req.method === 'GET') {
          // GET /api/menu-complete?path=categories,{id}
          const category = await prisma.category.findUnique({
            where: { id: categoryId },
            include: {
              menuItems: {
                orderBy: { name: 'asc' }
              }
            }
          });

          if (!category) {
            return res.status(404).json({
              success: false,
              error: 'Category not found'
            });
          }

          return res.status(200).json({
            success: true,
            data: category
          });
        } else if (req.method === 'PUT') {
          // PUT /api/menu-complete?path=categories,{id}
          const { name, description } = req.body;

          const category = await prisma.category.update({
            where: { id: categoryId },
            data: { name, description }
          });

          return res.status(200).json({
            success: true,
            data: category
          });
        } else if (req.method === 'DELETE') {
          // DELETE /api/menu-complete?path=categories,{id}
          await prisma.category.delete({
            where: { id: categoryId }
          });

          return res.status(200).json({
            success: true,
            message: 'Category deleted successfully'
          });
        }
      }
    } else if (path[0] === 'items') {
      // Items operations
      if (path.length === 1) {
        // GET /api/menu-complete?path=items - Get all items
        if (req.method === 'GET') {
          const items = await prisma.menuItem.findMany({
            include: {
              category: true
            },
            orderBy: { name: 'asc' }
          });

          return res.status(200).json({
            success: true,
            data: items
          });
        }
        // POST /api/menu-complete?path=items - Create item
        else if (req.method === 'POST') {
          const { name, description, price, categoryId } = req.body;

          if (!name || !categoryId) {
            return res.status(400).json({
              success: false,
              error: 'Item name and category are required'
            });
          }

          const item = await prisma.menuItem.create({
            data: { name, description, price, categoryId },
            include: { category: true }
          });

          return res.status(201).json({
            success: true,
            data: item
          });
        }
      } else if (path.length === 2) {
        // Operations on specific item by ID
        const itemId = path[1];

        if (req.method === 'GET') {
          // GET /api/menu-complete?path=items,{id}
          const item = await prisma.menuItem.findUnique({
            where: { id: itemId },
            include: { category: true }
          });

          if (!item) {
            return res.status(404).json({
              success: false,
              error: 'Item not found'
            });
          }

          return res.status(200).json({
            success: true,
            data: item
          });
        } else if (req.method === 'PUT') {
          // PUT /api/menu-complete?path=items,{id}
          const { name, description, price, categoryId } = req.body;

          const item = await prisma.menuItem.update({
            where: { id: itemId },
            data: { name, description, price, categoryId },
            include: { category: true }
          });

          return res.status(200).json({
            success: true,
            data: item
          });
        } else if (req.method === 'DELETE') {
          // DELETE /api/menu-complete?path=items,{id}
          await prisma.menuItem.delete({
            where: { id: itemId }
          });

          return res.status(200).json({
            success: true,
            message: 'Item deleted successfully'
          });
        }
      }
    }

    // Method not allowed
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });

  } catch (error) {
    console.error('Menu API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  } finally {
    await prisma.$disconnect();
  }
}