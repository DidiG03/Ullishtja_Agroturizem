import { PrismaClient } from '@prisma/client';
import { timeSlotService } from '../src/services/timeSlotService.js';

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
    const { action, date, time, guests } = req.query;

    if (req.method === 'GET') {
      if (action === 'available') {
        // Get available time slots for a specific date
        if (!date) {
          return res.status(400).json({ 
            success: false, 
            error: 'Date parameter is required for availability check' 
          });
        }
        
        const result = await timeSlotService.getAvailableSlots(date);
        return res.json(result);
      }
      
      if (action === 'validate') {
        // Validate a specific reservation
        if (!date || !time || !guests) {
          return res.status(400).json({ 
            success: false, 
            error: 'Date, time, and guests parameters are required for validation' 
          });
        }
        
        const result = await timeSlotService.validateReservation(date, time, parseInt(guests));
        return res.json(result);
      }
      
      if (action === 'seed') {
        // Seed default time slots
        const result = await timeSlotService.seedDefaultSlots();
        return res.json(result);
      }
      
      // Default: get all time slots
      const result = await timeSlotService.getAll();
      return res.json(result);
    }

    if (req.method === 'POST') {
      // Create a new time slot
      const result = await timeSlotService.create(req.body);
      return res.json(result);
    }

    if (req.method === 'PUT') {
      // Update time slot capacity or settings
      const { id, ...updateData } = req.body;
      if (!id) {
        return res.status(400).json({ 
          success: false, 
          error: 'Time slot ID is required for update' 
        });
      }
      
      const result = await timeSlotService.update(id, updateData);
      return res.json(result);
    }

    if (req.method === 'DELETE') {
      // Delete a time slot
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ 
          success: false, 
          error: 'Time slot ID is required for deletion' 
        });
      }
      
      const result = await timeSlotService.delete(id);
      return res.json(result);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error with time slots:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to process time slot request' 
    });
  }
} 