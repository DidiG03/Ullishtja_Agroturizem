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

  if (req.method === 'GET') {
    try {
      const categories = await prisma.menuCategory.findMany({
        where: { isActive: true },
        include: {
          menuItems: {
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' }
          }
        },
        orderBy: { displayOrder: 'asc' }
      });
      
      res.status(200).json({ success: true, data: categories });
    } catch (error) {
      console.error('Error fetching complete menu:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch complete menu',
        details: error.message 
      });
    }
  } else {
    res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }
} 