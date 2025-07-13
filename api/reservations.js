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
      // Get all reservations with optional filtering
      const { page = 1, limit = 100, status, date } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = {};
      if (status) where.status = status;
      if (date) {
        where.date = {
          gte: new Date(date),
          lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000),
        };
      }

      const [reservations, total] = await Promise.all([
        prisma.reservation.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
        }),
        prisma.reservation.count({ where }),
      ]);

      res.json({
        success: true,
        data: reservations,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      });

    } else if (req.method === 'POST') {
      // Create a new reservation
      const reservationData = req.body;
      
      // Import time slot service for validation
      const { timeSlotService } = await import('../src/services/timeSlotService.js');
      
      // Validate time slot capacity
      const validation = await timeSlotService.validateReservation(
        reservationData.date,
        reservationData.time,
        reservationData.guests
      );
      
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: validation.error || 'Time slot is not available'
        });
      }
      
      const reservation = await prisma.reservation.create({
        data: {
          ...reservationData,
          date: new Date(reservationData.date),
        },
      });

      // Create or update customer record
      if (reservationData.email) {
        try {
          await prisma.customer.upsert({
            where: { email: reservationData.email },
            update: {
              name: reservationData.name,
              phone: reservationData.phone,
              totalVisits: { increment: 1 },
              lastVisit: new Date(),
            },
            create: {
              name: reservationData.name,
              email: reservationData.email,
              phone: reservationData.phone,
              totalVisits: 1,
              lastVisit: new Date(),
            },
          });
        } catch (customerError) {
          console.error('Error updating customer:', customerError);
          // Don't fail the reservation if customer update fails
        }
      }

      res.json({ success: true, data: reservation });

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error with reservations:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to process reservation request' 
    });
  }
} 