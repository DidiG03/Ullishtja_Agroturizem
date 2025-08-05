// Consolidated Timeslots API - All timeslot operations in one function
// Handles timeslots and capacity management

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { path } = req.query;

  try {
    if (!path || path.length === 0) {
      // Base timeslots operations
      if (req.method === 'GET') {
        // GET /api/timeslots-complete - Get all timeslots
        const { date, available } = req.query;

        let whereClause = {};

        // If date is provided, filter by date
        if (date) {
          const targetDate = new Date(date);
          whereClause.date = {
            gte: new Date(targetDate.setHours(0, 0, 0, 0)),
            lt: new Date(targetDate.setHours(23, 59, 59, 999))
          };
        }

        const timeslots = await prisma.timeSlot.findMany({
          where: whereClause,
          include: {
            _count: {
              select: {
                reservations: {
                  where: {
                    status: {
                      in: ['pending', 'confirmed']
                    }
                  }
                }
              }
            }
          },
          orderBy: [
            { date: 'asc' },
            { startTime: 'asc' }
          ]
        });

        // Transform to include availability information
        const transformedTimeslots = timeslots.map(slot => ({
          ...slot,
          currentReservations: slot._count.reservations,
          isAvailable: slot._count.reservations < slot.capacity,
          remainingCapacity: slot.capacity - slot._count.reservations
        }));

        // Filter by availability if requested
        let filteredTimeslots = transformedTimeslots;
        if (available === 'true') {
          filteredTimeslots = transformedTimeslots.filter(slot => slot.isAvailable);
        } else if (available === 'false') {
          filteredTimeslots = transformedTimeslots.filter(slot => !slot.isAvailable);
        }

        return res.status(200).json({
          success: true,
          data: filteredTimeslots
        });

      } else if (req.method === 'POST') {
        // POST /api/timeslots-complete - Create new timeslot
        const {
          date,
          startTime,
          endTime,
          capacity = 4,
          isAvailable = true
        } = req.body;

        // Validate required fields
        if (!date || !startTime || !endTime) {
          return res.status(400).json({
            success: false,
            error: 'Missing required fields: date, startTime, endTime'
          });
        }

        // Validate date format
        const slotDate = new Date(date);
        if (isNaN(slotDate.getTime())) {
          return res.status(400).json({
            success: false,
            error: 'Invalid date format'
          });
        }

        // Check if timeslot already exists
        const existingSlot = await prisma.timeSlot.findFirst({
          where: {
            date: slotDate,
            startTime: startTime
          }
        });

        if (existingSlot) {
          return res.status(409).json({
            success: false,
            error: 'Timeslot already exists for this date and time'
          });
        }

        // Create the timeslot
        const timeslot = await prisma.timeSlot.create({
          data: {
            date: slotDate,
            startTime,
            endTime,
            capacity: parseInt(capacity),
            isAvailable
          }
        });

        return res.status(201).json({
          success: true,
          data: timeslot
        });
      }
    } else if (path[0] === 'capacity') {
      // Capacity management operations
      if (req.method === 'GET') {
        // GET /api/timeslots-complete?path=capacity
        const { date } = req.query;

        if (!date) {
          return res.status(400).json({
            success: false,
            error: 'Date parameter is required'
          });
        }

        const targetDate = new Date(date);
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

        // Get all timeslots for the date with reservation counts
        const timeslots = await prisma.timeSlot.findMany({
          where: {
            date: {
              gte: startOfDay,
              lt: endOfDay
            }
          },
          include: {
            reservations: {
              where: {
                status: {
                  in: ['pending', 'confirmed']
                }
              }
            },
            _count: {
              select: {
                reservations: {
                  where: {
                    status: {
                      in: ['pending', 'confirmed']
                    }
                  }
                }
              }
            }
          },
          orderBy: { startTime: 'asc' }
        });

        // Calculate capacity information
        const capacityInfo = timeslots.map(slot => ({
          id: slot.id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          capacity: slot.capacity,
          currentReservations: slot._count.reservations,
          availableSlots: slot.capacity - slot._count.reservations,
          isAvailable: slot._count.reservations < slot.capacity,
          reservations: slot.reservations.map(r => ({
            id: r.id,
            customerName: r.customerName,
            guests: r.guests,
            status: r.status
          }))
        }));

        return res.status(200).json({
          success: true,
          data: {
            date: date,
            totalSlots: timeslots.length,
            timeslots: capacityInfo
          }
        });

      } else if (req.method === 'PUT') {
        // PUT /api/timeslots-complete?path=capacity - Update capacity for a timeslot
        const { timeslotId, capacity } = req.body;

        if (!timeslotId || !capacity) {
          return res.status(400).json({
            success: false,
            error: 'Timeslot ID and capacity are required'
          });
        }

        const timeslot = await prisma.timeSlot.update({
          where: { id: timeslotId },
          data: { capacity: parseInt(capacity) }
        });

        return res.status(200).json({
          success: true,
          data: timeslot
        });
      }
    }

    // Method not allowed
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });

  } catch (error) {
    console.error('Timeslots API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  } finally {
    await prisma.$disconnect();
  }
}