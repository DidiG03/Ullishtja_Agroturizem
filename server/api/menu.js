const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.menuCategory.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      include: {
        menuItems: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' }
        }
      }
    });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Create category
router.post('/categories', async (req, res) => {
  try {
    const category = await prisma.menuCategory.create({
      data: req.body
    });
    res.json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update category
router.put('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const category = await prisma.menuCategory.update({
      where: { id },
      data: req.body
    });
    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete category
router.delete('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.menuCategory.delete({
      where: { id }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// Get menu items (optionally filtered by category)
router.get('/items', async (req, res) => {
  try {
    const { categoryId } = req.query;
    const where = { isActive: true };
    if (categoryId) {
      where.categoryId = categoryId;
    }

    const items = await prisma.menuItem.findMany({
      where,
      orderBy: { displayOrder: 'asc' },
      include: {
        category: true
      }
    });
    res.json(items);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

// Create menu item
router.post('/items', async (req, res) => {
  try {
    const item = await prisma.menuItem.create({
      data: req.body,
      include: {
        category: true
      }
    });
    res.json(item);
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({ error: 'Failed to create menu item' });
  }
});

// Update menu item
router.put('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const item = await prisma.menuItem.update({
      where: { id },
      data: req.body,
      include: {
        category: true
      }
    });
    res.json(item);
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

// Delete menu item
router.delete('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.menuItem.delete({
      where: { id }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

// Get complete menu structure
router.get('/complete', async (req, res) => {
  try {
    const categories = await prisma.menuCategory.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      include: {
        menuItems: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' }
        }
      }
    });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching complete menu:', error);
    res.status(500).json({ error: 'Failed to fetch complete menu' });
  }
});

// Reorder categories
router.post('/categories/reorder', async (req, res) => {
  try {
    const { orders } = req.body; // Array of { id, displayOrder }
    
    const promises = orders.map(({ id, displayOrder }) =>
      prisma.menuCategory.update({
        where: { id },
        data: { displayOrder }
      })
    );
    
    await Promise.all(promises);
    res.json({ success: true });
  } catch (error) {
    console.error('Error reordering categories:', error);
    res.status(500).json({ error: 'Failed to reorder categories' });
  }
});

// Reorder menu items
router.post('/items/reorder', async (req, res) => {
  try {
    const { orders } = req.body; // Array of { id, displayOrder }
    
    const promises = orders.map(({ id, displayOrder }) =>
      prisma.menuItem.update({
        where: { id },
        data: { displayOrder }
      })
    );
    
    await Promise.all(promises);
    res.json({ success: true });
  } catch (error) {
    console.error('Error reordering menu items:', error);
    res.status(500).json({ error: 'Failed to reorder menu items' });
  }
});

module.exports = router; 