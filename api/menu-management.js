import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { action, id } = req.query;

  try {
    switch (action) {
      case 'categories':
        return await handleCategories(req, res);
      case 'category':
        return await handleCategory(req, res, id);
      case 'category-reorder':
        return await handleCategoryReorder(req, res);
      case 'items':
        return await handleItems(req, res);
      case 'item':
        return await handleItem(req, res, id);
      case 'item-reorder':
        return await handleItemReorder(req, res);
      case 'complete':
        return await handleComplete(req, res);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Error in menu management:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Categories handlers
async function handleCategories(req, res) {
  if (req.method === 'GET') {
    const categories = await prisma.menuCategory.findMany({
      orderBy: { order: 'asc' }
    });
    res.json({ success: true, data: categories });
  } else if (req.method === 'POST') {
    const { name, description } = req.body;
    const maxOrder = await prisma.menuCategory.findFirst({
      orderBy: { order: 'desc' }
    });
    
    const category = await prisma.menuCategory.create({
      data: {
        name,
        description,
        order: (maxOrder?.order || 0) + 1
      }
    });
    res.json({ success: true, data: category });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleCategory(req, res, id) {
  if (req.method === 'PUT') {
    const { name, description } = req.body;
    const category = await prisma.menuCategory.update({
      where: { id: parseInt(id) },
      data: { name, description }
    });
    res.json({ success: true, data: category });
  } else if (req.method === 'DELETE') {
    await prisma.menuCategory.delete({
      where: { id: parseInt(id) }
    });
    res.json({ success: true });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleCategoryReorder(req, res) {
  if (req.method === 'PUT') {
    const { categories } = req.body;
    
    const updatePromises = categories.map(category =>
      prisma.menuCategory.update({
        where: { id: category.id },
        data: { order: category.order }
      })
    );
    
    await Promise.all(updatePromises);
    res.json({ success: true });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

// Items handlers
async function handleItems(req, res) {
  if (req.method === 'GET') {
    const items = await prisma.menuItem.findMany({
      include: { category: true },
      orderBy: { order: 'asc' }
    });
    res.json({ success: true, data: items });
  } else if (req.method === 'POST') {
    const { name, description, price, categoryId } = req.body;
    const maxOrder = await prisma.menuItem.findFirst({
      where: { categoryId: parseInt(categoryId) },
      orderBy: { order: 'desc' }
    });
    
    const item = await prisma.menuItem.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        categoryId: parseInt(categoryId),
        order: (maxOrder?.order || 0) + 1
      },
      include: { category: true }
    });
    res.json({ success: true, data: item });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleItem(req, res, id) {
  if (req.method === 'PUT') {
    const { name, description, price, categoryId } = req.body;
    const item = await prisma.menuItem.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        price: parseFloat(price),
        categoryId: parseInt(categoryId)
      },
      include: { category: true }
    });
    res.json({ success: true, data: item });
  } else if (req.method === 'DELETE') {
    await prisma.menuItem.delete({
      where: { id: parseInt(id) }
    });
    res.json({ success: true });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleItemReorder(req, res) {
  if (req.method === 'PUT') {
    const { items } = req.body;
    
    const updatePromises = items.map(item =>
      prisma.menuItem.update({
        where: { id: item.id },
        data: { order: item.order }
      })
    );
    
    await Promise.all(updatePromises);
    res.json({ success: true });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleComplete(req, res) {
  if (req.method === 'GET') {
    const categories = await prisma.menuCategory.findMany({
      include: {
        items: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { order: 'asc' }
    });
    res.json({ success: true, data: categories });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
} 