const { PrismaClient } = require('@prisma/client');

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
    } else if (req.method === 'POST') {
      const category = await prisma.menuCategory.create({
        data: req.body
      });
      res.json(category);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error with categories:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
} 