import prisma from '../lib/prisma.js';

/**
 * Time Slot Management Service
 * Handles time slot capacity, availability, and booking validation
 */

export const timeSlotService = {
  /**
   * Get all time slots with their capacity settings
   */
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

  /**
   * Create a new time slot
   */
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

  /**
   * Update a time slot
   */
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

  /**
   * Delete a time slot
   */
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

  /**
   * Set capacity override for a specific day of the week
   */
  async setCapacityOverride(timeSlotId, dayOfWeek, maxCapacity) {
    try {
      const override = await prisma.timeSlotCapacity.upsert({
        where: {
          timeSlotId_dayOfWeek: {
            timeSlotId,
            dayOfWeek,
          },
        },
        create: {
          timeSlotId,
          dayOfWeek,
          maxCapacity,
        },
        update: {
          maxCapacity,
        },
      });
      return { success: true, data: override };
    } catch (error) {
      console.error('Error setting capacity override:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Remove capacity override for a specific day of the week
   */
  async removeCapacityOverride(timeSlotId, dayOfWeek) {
    try {
      await prisma.timeSlotCapacity.delete({
        where: {
          timeSlotId_dayOfWeek: {
            timeSlotId,
            dayOfWeek,
          },
        },
      });
      return { success: true };
    } catch (error) {
      console.error('Error removing capacity override:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get available time slots for a specific date
   */
  async getAvailableSlots(date) {
    try {
      const targetDate = new Date(date);
      const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
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

  /**
   * Check if a specific time slot is available for booking
   */
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
            in: ['PENDING', 'CONFIRMED'], // Only count active reservations
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

  /**
   * Validate if a reservation can be made for a specific time slot
   */
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

  /**
   * Seed default time slots
   */
  async seedDefaultSlots() {
    try {
      const defaultSlots = [
        { time: '12:00', maxCapacity: 20, displayOrder: 1 },
        { time: '12:30', maxCapacity: 20, displayOrder: 2 },
        { time: '13:00', maxCapacity: 20, displayOrder: 3 },
        { time: '13:30', maxCapacity: 20, displayOrder: 4 },
        { time: '14:00', maxCapacity: 20, displayOrder: 5 },
        { time: '14:30', maxCapacity: 20, displayOrder: 6 },
        { time: '15:00', maxCapacity: 20, displayOrder: 7 },
        { time: '18:00', maxCapacity: 25, displayOrder: 8 },
        { time: '18:30', maxCapacity: 25, displayOrder: 9 },
        { time: '19:00', maxCapacity: 30, displayOrder: 10 },
        { time: '19:30', maxCapacity: 30, displayOrder: 11 },
        { time: '20:00', maxCapacity: 30, displayOrder: 12 },
        { time: '20:30', maxCapacity: 25, displayOrder: 13 },
        { time: '21:00', maxCapacity: 20, displayOrder: 14 },
        { time: '21:30', maxCapacity: 15, displayOrder: 15 },
      ];

      const createdSlots = [];
      
      for (const slotData of defaultSlots) {
        // Check if slot already exists
        const existingSlot = await prisma.timeSlot.findFirst({
          where: { time: slotData.time },
        });

        if (!existingSlot) {
          const slot = await prisma.timeSlot.create({
            data: slotData,
          });
          createdSlots.push(slot);
        }
      }

      return { success: true, data: createdSlots };
    } catch (error) {
      console.error('Error seeding default slots:', error);
      return { success: false, error: error.message };
    }
  },
};

export default timeSlotService; 