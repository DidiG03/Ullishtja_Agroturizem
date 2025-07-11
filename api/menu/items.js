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

  try {
    if (req.method === 'GET') {
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
    } else if (req.method === 'POST') {
      const item = await prisma.menuItem.create({
        data: req.body,
        include: {
          category: true
        }
      });
      res.json(item);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error with menu items:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
} 