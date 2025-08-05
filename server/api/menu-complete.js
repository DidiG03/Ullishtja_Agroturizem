// Express route handler for consolidated menu API
// Adapted from the Vercel serverless function

const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Handler function that mimics the serverless function
async function handleMenuRequest(req, res) {
  const { path } = req.query;
  const pathArray = path ? path.split(',') : [];

  try {
    // Route based on path parameter
    if (!pathArray || pathArray.length === 0) {
      // GET /api/menu-complete - Complete menu with categories and items
      if (req.method === 'GET') {
        const categories = await prisma.menuCategory.findMany({
          include: {
            menuItems: {
              orderBy: { nameAL: 'asc' }
            }
          },
          orderBy: { nameAL: 'asc' }
        });

        return res.status(200).json({
          success: true,
          data: categories
        });
      }
    } else if (pathArray[0] === 'categories') {
      // Categories operations
      if (pathArray.length === 1) {
        // GET /api/menu-complete?path=categories - Get all categories
        if (req.method === 'GET') {
          const categories = await prisma.menuCategory.findMany({
            orderBy: { nameAL: 'asc' }
          });

          return res.status(200).json({
            success: true,
            data: categories
          });
        }
        // POST /api/menu-complete?path=categories - Create category
        else if (req.method === 'POST') {
          const { nameAL, nameEN, nameIT, slug, displayOrder, isActive } = req.body;

          if (!nameAL || !nameEN || !nameIT || !slug) {
            return res.status(400).json({
              success: false,
              error: 'Category names in all languages and slug are required'
            });
          }

          const category = await prisma.menuCategory.create({
            data: { 
              nameAL, 
              nameEN, 
              nameIT, 
              slug,
              displayOrder: displayOrder || 0,
              isActive: isActive !== undefined ? isActive : true
            }
          });

          return res.status(201).json({
            success: true,
            data: category
          });
        }
      } else if (pathArray.length === 2) {
        // Operations on specific category by ID
        const categoryId = pathArray[1];

        if (req.method === 'GET') {
          // GET /api/menu-complete?path=categories,{id}
          const category = await prisma.menuCategory.findUnique({
            where: { id: categoryId },
            include: {
              menuItems: {
                orderBy: { nameAL: 'asc' }
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
          const { nameAL, nameEN, nameIT, slug, displayOrder, isActive } = req.body;

          const updateData = {};
          if (nameAL !== undefined) updateData.nameAL = nameAL;
          if (nameEN !== undefined) updateData.nameEN = nameEN;
          if (nameIT !== undefined) updateData.nameIT = nameIT;
          if (slug !== undefined) updateData.slug = slug;
          if (displayOrder !== undefined) updateData.displayOrder = displayOrder;
          if (isActive !== undefined) updateData.isActive = isActive;

          const category = await prisma.menuCategory.update({
            where: { id: categoryId },
            data: updateData
          });

          return res.status(200).json({
            success: true,
            data: category
          });
        } else if (req.method === 'DELETE') {
          // DELETE /api/menu-complete?path=categories,{id}
          await prisma.menuCategory.delete({
            where: { id: categoryId }
          });

          return res.status(200).json({
            success: true,
            message: 'Category deleted successfully'
          });
        }
      }
    } else if (pathArray[0] === 'items') {
      // Items operations
      if (pathArray.length === 1) {
        // GET /api/menu-complete?path=items - Get all items
        if (req.method === 'GET') {
          const { categoryId } = req.query;
          
          let whereClause = {};
          if (categoryId) {
            whereClause.categoryId = categoryId;
          }

          const items = await prisma.menuItem.findMany({
            where: whereClause,
            include: {
              category: true
            },
            orderBy: { nameAL: 'asc' }
          });

          return res.status(200).json({
            success: true,
            data: items
          });
        }
        // POST /api/menu-complete?path=items - Create item
        else if (req.method === 'POST') {
          const { 
            nameAL, nameEN, nameIT,
            descriptionAL, descriptionEN, descriptionIT,
            ingredientsAL, ingredientsEN, ingredientsIT,
            price, categoryId, currency, displayOrder, isActive,
            isVegetarian, isSpicy, isRecommended, isNew, allergens, imageUrl
          } = req.body;

          if (!nameAL || !nameEN || !nameIT || !categoryId) {
            return res.status(400).json({
              success: false,
              error: 'Item names in all languages and category are required'
            });
          }

          const item = await prisma.menuItem.create({
            data: { 
              nameAL, nameEN, nameIT,
              descriptionAL, descriptionEN, descriptionIT,
              ingredientsAL, ingredientsEN, ingredientsIT,
              price: price ? parseFloat(price) : 0,
              categoryId,
              currency: currency || 'ALL',
              displayOrder: displayOrder || 0,
              isActive: isActive !== undefined ? isActive : true,
              isVegetarian: isVegetarian || false,
              isSpicy: isSpicy || false,
              isRecommended: isRecommended || false,
              isNew: isNew || false,
              allergens,
              imageUrl
            },
            include: { category: true }
          });

          return res.status(201).json({
            success: true,
            data: item
          });
        }
      } else if (pathArray.length === 2) {
        // Operations on specific item by ID
        const itemId = pathArray[1];

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
          const { 
            nameAL, nameEN, nameIT,
            descriptionAL, descriptionEN, descriptionIT,
            ingredientsAL, ingredientsEN, ingredientsIT,
            price, categoryId, currency, displayOrder, isActive,
            isVegetarian, isSpicy, isRecommended, isNew, allergens, imageUrl
          } = req.body;

          const updateData = {};
          if (nameAL !== undefined) updateData.nameAL = nameAL;
          if (nameEN !== undefined) updateData.nameEN = nameEN;
          if (nameIT !== undefined) updateData.nameIT = nameIT;
          if (descriptionAL !== undefined) updateData.descriptionAL = descriptionAL;
          if (descriptionEN !== undefined) updateData.descriptionEN = descriptionEN;
          if (descriptionIT !== undefined) updateData.descriptionIT = descriptionIT;
          if (ingredientsAL !== undefined) updateData.ingredientsAL = ingredientsAL;
          if (ingredientsEN !== undefined) updateData.ingredientsEN = ingredientsEN;
          if (ingredientsIT !== undefined) updateData.ingredientsIT = ingredientsIT;
          if (price !== undefined) updateData.price = parseFloat(price);
          if (categoryId !== undefined) updateData.categoryId = categoryId;
          if (currency !== undefined) updateData.currency = currency;
          if (displayOrder !== undefined) updateData.displayOrder = displayOrder;
          if (isActive !== undefined) updateData.isActive = isActive;
          if (isVegetarian !== undefined) updateData.isVegetarian = isVegetarian;
          if (isSpicy !== undefined) updateData.isSpicy = isSpicy;
          if (isRecommended !== undefined) updateData.isRecommended = isRecommended;
          if (isNew !== undefined) updateData.isNew = isNew;
          if (allergens !== undefined) updateData.allergens = allergens;
          if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

          const item = await prisma.menuItem.update({
            where: { id: itemId },
            data: updateData,
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
  }
}

// Mount all HTTP methods
router.all('/', handleMenuRequest);

module.exports = router;