// Consolidated Timeslots API - All timeslot operations in one function
// Handles timeslots and capacity management

const prisma = require('../src/lib/prisma.js').default;

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
        const { date, available, action } = req.query;

        // Handle seeding action
        if (action === 'seed') {
          // Create default time slots for the next 30 days
          const today = new Date();
          const slots = [];
          
          for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            
            // Skip Sundays (day 0)
            if (date.getDay() === 0) continue;
            
            // Default time slots
            const defaultTimes = [
              { start: '12:00', end: '14:00' },
              { start: '14:30', end: '16:30' },
              { start: '19:00', end: '21:00' },
              { start: '21:30', end: '23:30' }
            ];
            
            for (const time of defaultTimes) {
              // Check if slot already exists
              const existing = await prisma.timeSlot.findFirst({
                where: {
                  date: date,
                  startTime: time.start
                }
              });
              
              if (!existing) {
                const slot = await prisma.timeSlot.create({
                  data: {
                    date: date,
                    startTime: time.start,
                    endTime: time.end,
                    capacity: 4,
                    isAvailable: true
                  }
                });
                slots.push(slot);
              }
            }
          }
          
          return res.status(200).json({
            success: true,
            message: `Created ${slots.length} default time slots`,
            data: slots
          });
        }

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
        const { date, validate, time, guests } = req.query;

        // Handle validation request
        if (validate === 'true') {
          if (!date || !time || !guests) {
            return res.status(400).json({
              success: false,
              error: 'Date, time, and guests parameters are required for validation'
            });
          }

          const targetDate = new Date(date);
          const guestCount = parseInt(guests);

          // Find the specific timeslot
          const timeslot = await prisma.timeSlot.findFirst({
            where: {
              date: {
                gte: new Date(targetDate.setHours(0, 0, 0, 0)),
                lt: new Date(targetDate.setHours(23, 59, 59, 999))
              },
              startTime: time
            },
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
            }
          });

          if (!timeslot) {
            return res.status(200).json({
              isValid: false,
              error: 'Time slot not available'
            });
          }

          const currentReservations = timeslot._count.reservations;
          const remainingCapacity = timeslot.capacity - currentReservations;

          if (remainingCapacity < guestCount) {
            return res.status(200).json({
              isValid: false,
              error: `Not enough capacity. Only ${remainingCapacity} spots available.`
            });
          }

          return res.status(200).json({
            isValid: true,
            timeslotId: timeslot.id,
            remainingCapacity: remainingCapacity
          });
        }

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
      } else if (req.method === 'POST') {
        // POST /api/timeslots-complete?path=capacity - Create capacity override (from TimeSlotManagement)
        const { timeSlotId, dayOfWeek, maxCapacity } = req.body;

        if (!timeSlotId || dayOfWeek === undefined || !maxCapacity) {
          return res.status(400).json({
            success: false,
            error: 'TimeSlot ID, dayOfWeek, and maxCapacity are required'
          });
        }

        // Update the capacity for the specific timeslot
        const timeslot = await prisma.timeSlot.update({
          where: { id: timeSlotId },
          data: { capacity: parseInt(maxCapacity) }
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