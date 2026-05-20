// Consolidated Menu API - All menu operations in one function
// Handles categories, items, and complete menu data

import prisma from '../src/lib/prisma.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { path } = req.query;

  try {
    // Parse path parameter - convert string to array if necessary
    const pathArray = path ? (Array.isArray(path) ? path : path.split(',')) : [];
    
    // Route based on path parameter
    if (!pathArray || pathArray.length === 0) {
      // GET /api/menu-complete - Complete menu with categories and items
      if (req.method === 'GET') {
        const categories = await prisma.menuCategory.findMany({
          include: {
            menuItems: {
              orderBy: [{ displayOrder: 'asc' }, { nameAL: 'asc' }]
            }
          },
          orderBy: [{ displayOrder: 'asc' }, { nameAL: 'asc' }]
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
            orderBy: [{ displayOrder: 'asc' }, { nameAL: 'asc' }]
          });

          return res.status(200).json({
            success: true,
            data: categories
          });
        }
        // PATCH /api/menu-complete?path=categories - Bulk update display order
        else if (req.method === 'PATCH') {
          const { orders } = req.body;

          if (!Array.isArray(orders) || orders.length === 0) {
            return res.status(400).json({
              success: false,
              error: 'orders array with id and displayOrder is required'
            });
          }

          await prisma.$transaction(
            orders.map(({ id, displayOrder }) =>
              prisma.menuCategory.update({
                where: { id },
                data: { displayOrder: Number(displayOrder) }
              })
            )
          );

          return res.status(200).json({
            success: true,
            message: 'Category order updated'
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
                orderBy: [{ displayOrder: 'asc' }, { nameAL: 'asc' }]
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
    } else if (pathArray[0] === 'import') {
      // POST /api/menu-complete?path=import — bulk upsert from parsed Excel
      if (req.method === 'POST') {
        const { categories = [], items = [] } = req.body;

        if (!Array.isArray(categories) || !Array.isArray(items)) {
          return res.status(400).json({
            success: false,
            error: 'categories and items arrays are required'
          });
        }

        const existingCategories = await prisma.menuCategory.findMany();
        const existingItems = await prisma.menuItem.findMany();

        const slugToCategoryId = new Map(
          existingCategories.map((c) => [c.slug, c.id])
        );
        const itemKeyToId = new Map(
          existingItems.map((i) => [
            `${i.categoryId}::${i.nameAL.trim().toLowerCase()}`,
            i.id
          ])
        );

        let createdCategories = 0;
        let updatedCategories = 0;
        let createdItems = 0;
        let updatedItems = 0;

        await prisma.$transaction(async (tx) => {
          for (const cat of categories) {
            const {
              slug,
              nameAL,
              nameEN,
              nameIT,
              displayOrder = 0,
              isActive = true
            } = cat;

            if (!slug || !nameAL) continue;

            const existingId = slugToCategoryId.get(slug);
            const categoryData = {
              nameAL,
              nameEN: nameEN || nameAL,
              nameIT: nameIT || nameEN || nameAL,
              displayOrder: Number(displayOrder) || 0,
              isActive: isActive !== false
            };

            if (existingId) {
              await tx.menuCategory.update({
                where: { id: existingId },
                data: categoryData
              });
              updatedCategories += 1;
            } else {
              const created = await tx.menuCategory.create({
                data: { slug, ...categoryData }
              });
              slugToCategoryId.set(slug, created.id);
              createdCategories += 1;
            }
          }

          for (const item of items) {
            const {
              categorySlug,
              nameAL,
              nameEN,
              nameIT,
              price,
              displayOrder = 0,
              isActive = true
            } = item;

            const categoryId = slugToCategoryId.get(categorySlug);
            if (!categoryId || !nameAL) continue;

            const itemData = {
              nameAL,
              nameEN: nameEN || nameAL,
              nameIT: nameIT || nameEN || nameAL,
              price: price != null ? parseFloat(price) : 0,
              displayOrder: Number(displayOrder) || 0,
              categoryId,
              isActive: isActive !== false,
              currency: 'ALL'
            };

            const key = `${categoryId}::${nameAL.trim().toLowerCase()}`;
            const existingId = itemKeyToId.get(key);

            if (existingId) {
              await tx.menuItem.update({
                where: { id: existingId },
                data: itemData
              });
              updatedItems += 1;
            } else {
              const created = await tx.menuItem.create({ data: itemData });
              itemKeyToId.set(key, created.id);
              createdItems += 1;
            }
          }
        });

        return res.status(200).json({
          success: true,
          data: {
            createdCategories,
            updatedCategories,
            createdItems,
            updatedItems
          }
        });
      }
    } else if (pathArray[0] === 'clear') {
      // POST /api/menu-complete?path=clear — remove all categories and items
      if (req.method === 'POST' || req.method === 'DELETE') {
        const confirm =
          req.body?.confirm === true ||
          req.body?.confirm === 'true' ||
          req.query.confirm === 'true';

        if (!confirm) {
          return res.status(400).json({
            success: false,
            error: 'Send { "confirm": true } to clear the menu'
          });
        }

        const result = await prisma.$transaction(async (tx) => {
          const deletedItems = await tx.menuItem.deleteMany();
          const deletedCategories = await tx.menuCategory.deleteMany();
          return {
            deletedItems: deletedItems.count,
            deletedCategories: deletedCategories.count
          };
        });

        return res.status(200).json({
          success: true,
          data: result,
          message: 'Menu cleared successfully'
        });
      }

      return res.status(405).json({
        success: false,
        error: 'Method not allowed. Use POST with { "confirm": true }.'
      });
    } else if (pathArray[0] === 'items') {
      // Items operations
      if (pathArray.length === 1) {
        // GET /api/menu-complete?path=items[&categoryId=...] - Get items (optionally by category)
        if (req.method === 'GET') {
          const { categoryId } = req.query;
          const items = await prisma.menuItem.findMany({
            where: categoryId ? { categoryId } : undefined,
            include: {
              category: true
            },
            orderBy: [{ displayOrder: 'asc' }, { nameAL: 'asc' }]
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
              isKg: req.body?.isKg === true || req.body?.isKg === 'true',
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
            isVegetarian, isSpicy, isRecommended, isNew, allergens, imageUrl, isKg
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
          if (isKg !== undefined) updateData.isKg = Boolean(isKg);
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
  } finally {
    await prisma.$disconnect();
  }
}