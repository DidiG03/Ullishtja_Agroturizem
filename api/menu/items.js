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
      res.status(200).json({ success: true, data: items });
      
    } else if (req.method === 'POST') {
      const item = await prisma.menuItem.create({
        data: req.body,
        include: {
          category: true
        }
      });
      res.status(201).json({ success: true, data: item });
      
    } else {
      res.status(405).json({ 
        success: false, 
        error: 'Method not allowed' 
      });
    }
  } catch (error) {
    console.error('Error in items API:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message 
    });
  }
} 