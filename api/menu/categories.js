import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
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
      res.status(200).json({ success: true, data: categories });
      
    } else if (req.method === 'POST') {
      const category = await prisma.menuCategory.create({
        data: req.body
      });
      res.status(201).json({ success: true, data: category });
      
    } else if (req.method === 'PATCH') {
      // Bulk update category orders
      const { orders } = req.body;
      
      if (!orders || !Array.isArray(orders)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Orders array is required' 
        });
      }
      
      // Update categories in parallel for better performance
      const updatePromises = orders.map(({ id, displayOrder }) =>
        prisma.menuCategory.update({
          where: { id },
          data: { displayOrder }
        })
      );
      
      await Promise.all(updatePromises);
      
      res.status(200).json({ success: true });
      
    } else {
      res.status(405).json({ 
        success: false, 
        error: 'Method not allowed' 
      });
    }
  } catch (error) {
    console.error('Error in categories API:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message 
    });
  }
} 