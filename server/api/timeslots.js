const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Time slot service functions (simplified for server-side)
const timeSlotService = {
  async getAll() {
    try {
      const timeSlots = await prisma.timeSlot.findMany({
        include: {
          capacityOverrides: true,
        },
        orderBy: {
          displayOrder: 'asc',
        },
      });
      return { success: true, data: timeSlots };
    } catch (error) {
      console.error('Error fetching time slots:', error);
      return { success: false, error: error.message };
    }
  },

  async getAvailableSlots(date) {
    try {
      const targetDate = new Date(date);
      const dayOfWeek = targetDate.getDay();
      
      // Get all active time slots
      const timeSlots = await prisma.timeSlot.findMany({
        where: { isActive: true },
        include: {
          capacityOverrides: {
            where: { dayOfWeek },
          },
        },
        orderBy: {
          displayOrder: 'asc',
        },
      });

      // Calculate availability for each time slot
      const availableSlots = [];
      
      for (const slot of timeSlots) {
        const availability = await this.checkSlotAvailability(slot, targetDate);
        if (availability.isAvailable) {
          availableSlots.push({
            ...slot,
            availableCapacity: availability.availableCapacity,
            maxCapacity: availability.maxCapacity,
          });
        }
      }

      return { success: true, data: availableSlots };
    } catch (error) {
      console.error('Error getting available slots:', error);
      return { success: false, error: error.message };
    }
  },

  async checkSlotAvailability(timeSlot, date) {
    try {
      const targetDate = new Date(date);
      const dayOfWeek = targetDate.getDay();
      
      // Determine capacity for this day
      let maxCapacity = timeSlot.maxCapacity;
      
      // Check if there's a capacity override for this day
      const capacityOverride = timeSlot.capacityOverrides?.find(
        override => override.dayOfWeek === dayOfWeek && override.isActive
      );
      
      if (capacityOverride) {
        maxCapacity = capacityOverride.maxCapacity;
      }

      // Get existing reservations for this time slot on this date
      const existingReservations = await prisma.reservation.findMany({
        where: {
          date: {
            gte: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()),
            lt: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1),
          },
          time: timeSlot.time,
          status: {
            in: ['PENDING', 'CONFIRMED'],
          },
        },
      });

      // Calculate current bookings
      const currentBookings = existingReservations.reduce((sum, reservation) => {
        return sum + reservation.guests;
      }, 0);

      const availableCapacity = maxCapacity - currentBookings;

      return {
        isAvailable: availableCapacity > 0,
        maxCapacity,
        currentBookings,
        availableCapacity,
      };
    } catch (error) {
      console.error('Error checking slot availability:', error);
      return {
        isAvailable: false,
        maxCapacity: 0,
        currentBookings: 0,
        availableCapacity: 0,
      };
    }
  },

  async validateReservation(date, time, guests) {
    try {
      // Find the time slot
      const timeSlot = await prisma.timeSlot.findFirst({
        where: {
          time: time,
          isActive: true,
        },
        include: {
          capacityOverrides: true,
        },
      });

      if (!timeSlot) {
        return {
          isValid: false,
          error: 'Time slot not found or not available',
        };
      }

      // Check availability
      const availability = await this.checkSlotAvailability(timeSlot, date);
      
      if (!availability.isAvailable) {
        return {
          isValid: false,
          error: 'Time slot is fully booked',
        };
      }

      if (availability.availableCapacity < guests) {
        return {
          isValid: false,
          error: `Not enough capacity. Available: ${availability.availableCapacity}, Requested: ${guests}`,
        };
      }

      return {
        isValid: true,
        availableCapacity: availability.availableCapacity,
        maxCapacity: availability.maxCapacity,
      };
    } catch (error) {
      console.error('Error validating reservation:', error);
      return {
        isValid: false,
        error: error.message,
      };
    }
  },

  async create(timeSlotData) {
    try {
      const timeSlot = await prisma.timeSlot.create({
        data: timeSlotData,
        include: {
          capacityOverrides: true,
        },
      });
      return { success: true, data: timeSlot };
    } catch (error) {
      console.error('Error creating time slot:', error);
      return { success: false, error: error.message };
    }
  },

  async update(id, timeSlotData) {
    try {
      const timeSlot = await prisma.timeSlot.update({
        where: { id },
        data: timeSlotData,
        include: {
          capacityOverrides: true,
        },
      });
      return { success: true, data: timeSlot };
    } catch (error) {
      console.error('Error updating time slot:', error);
      return { success: false, error: error.message };
    }
  },

  async delete(id) {
    try {
      await prisma.timeSlot.delete({
        where: { id },
      });
      return { success: true };
    } catch (error) {
      console.error('Error deleting time slot:', error);
      return { success: false, error: error.message };
    }
  },
};

// Get available time slots for a specific date
router.get('/available/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const result = await timeSlotService.getAvailableSlots(date);
    res.json(result);
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch available slots' 
    });
  }
});

// Validate a reservation
router.get('/validate', async (req, res) => {
  try {
    const { date, time, guests } = req.query;
    
    if (!date || !time || !guests) {
      return res.status(400).json({ 
        success: false, 
        error: 'Date, time, and guests parameters are required' 
      });
    }
    
    const result = await timeSlotService.validateReservation(date, time, parseInt(guests));
    res.json(result);
  } catch (error) {
    console.error('Error validating reservation:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to validate reservation' 
    });
  }
});

// Get all time slots
router.get('/', async (req, res) => {
  try {
    const result = await timeSlotService.getAll();
    res.json(result);
  } catch (error) {
    console.error('Error fetching time slots:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch time slots' 
    });
  }
});

// Create a new time slot
router.post('/', async (req, res) => {
  try {
    const result = await timeSlotService.create(req.body);
    res.json(result);
  } catch (error) {
    console.error('Error creating time slot:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to create time slot' 
    });
  }
});

// Update a time slot
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await timeSlotService.update(id, req.body);
    res.json(result);
  } catch (error) {
    console.error('Error updating time slot:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to update time slot' 
    });
  }
});

// Delete a time slot
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await timeSlotService.delete(id);
    res.json(result);
  } catch (error) {
    console.error('Error deleting time slot:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to delete time slot' 
    });
  }
});

module.exports = router; 