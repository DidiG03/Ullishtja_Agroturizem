const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Get all reservations
router.get('/', async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch reservations' 
    });
  }
});

// Create a new reservation
router.post('/', async (req, res) => {
  try {
    const reservationData = req.body;
    
    // Import time slot service for validation
    const { timeSlotService } = require('../../src/services/timeSlotService.js');
    
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
  } catch (error) {
    console.error('Error creating reservation:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to create reservation' 
    });
  }
});

// Update reservation status
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await prisma.reservation.update({
      where: { id },
      data: req.body,
    });
    res.json({ success: true, data: reservation });
  } catch (error) {
    console.error('Error updating reservation:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to update reservation' 
    });
  }
});

// Delete reservation
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.reservation.delete({
      where: { id }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting reservation:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to delete reservation' 
    });
  }
});

module.exports = router; 