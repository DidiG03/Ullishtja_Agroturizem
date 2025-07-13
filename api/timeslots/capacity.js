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
    if (req.method === 'POST') {
      // Create or update capacity override
      const { timeSlotId, dayOfWeek, maxCapacity } = req.body;

      if (!timeSlotId || dayOfWeek === undefined || !maxCapacity) {
        return res.status(400).json({ 
          success: false, 
          error: 'timeSlotId, dayOfWeek, and maxCapacity are required' 
        });
      }

      const override = await prisma.timeSlotCapacity.upsert({
        where: {
          timeSlotId_dayOfWeek: {
            timeSlotId,
            dayOfWeek: parseInt(dayOfWeek),
          },
        },
        create: {
          timeSlotId,
          dayOfWeek: parseInt(dayOfWeek),
          maxCapacity: parseInt(maxCapacity),
        },
        update: {
          maxCapacity: parseInt(maxCapacity),
        },
      });

      return res.json({ success: true, data: override });
    }

    if (req.method === 'DELETE') {
      // Delete capacity override
      const { timeSlotId, dayOfWeek } = req.body;

      if (!timeSlotId || dayOfWeek === undefined) {
        return res.status(400).json({ 
          success: false, 
          error: 'timeSlotId and dayOfWeek are required' 
        });
      }

      await prisma.timeSlotCapacity.delete({
        where: {
          timeSlotId_dayOfWeek: {
            timeSlotId,
            dayOfWeek: parseInt(dayOfWeek),
          },
        },
      });

      return res.json({ success: true });
    }

    if (req.method === 'GET') {
      // Get capacity overrides for a time slot
      const { timeSlotId } = req.query;

      if (!timeSlotId) {
        return res.status(400).json({ 
          success: false, 
          error: 'timeSlotId is required' 
        });
      }

      const overrides = await prisma.timeSlotCapacity.findMany({
        where: {
          timeSlotId,
          isActive: true,
        },
        orderBy: {
          dayOfWeek: 'asc',
        },
      });

      return res.json({ success: true, data: overrides });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error with capacity overrides:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to process capacity override request' 
    });
  }
} 