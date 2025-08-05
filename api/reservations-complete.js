// Consolidated Reservations API - All reservation operations in one function
// Handles reservation CRUD and individual reservation operations

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
      // Base reservations operations
      if (req.method === 'GET') {
        // GET /api/reservations-complete - Get all reservations
        const { status, startDate, endDate, limit = 50 } = req.query;

        let whereClause = {};

        if (status) {
          whereClause.status = status;
        }

        if (startDate || endDate) {
          whereClause.date = {};
          if (startDate) {
            whereClause.date.gte = new Date(startDate);
          }
          if (endDate) {
            whereClause.date.lte = new Date(endDate);
          }
        }

        const reservations = await prisma.reservation.findMany({
          where: whereClause,
          orderBy: [
            { date: 'desc' },
            { time: 'desc' }
          ],
          take: parseInt(limit)
        });

        return res.status(200).json({
          success: true,
          data: reservations
        });

      } else if (req.method === 'POST') {
        // POST /api/reservations-complete - Create new reservation
        const {
          customerName,
          customerEmail,
          customerPhone,
          date,
          time,
          guests,
          specialRequests,
          status = 'pending'
        } = req.body;

        // Validate required fields
        if (!customerName || !customerEmail || !date || !time || !guests) {
          return res.status(400).json({
            success: false,
            error: 'Missing required fields: customerName, customerEmail, date, time, guests'
          });
        }

        // Validate date format
        const reservationDate = new Date(date);
        if (isNaN(reservationDate.getTime())) {
          return res.status(400).json({
            success: false,
            error: 'Invalid date format'
          });
        }

        // Check if reservation slot is available
        const existingReservation = await prisma.reservation.findFirst({
          where: {
            date: reservationDate,
            time: time,
            status: {
              in: ['pending', 'confirmed']
            }
          }
        });

        if (existingReservation) {
          return res.status(409).json({
            success: false,
            error: 'Time slot already reserved'
          });
        }

        // Create the reservation
        const reservation = await prisma.reservation.create({
          data: {
            customerName,
            customerEmail,
            customerPhone,
            date: reservationDate,
            time,
            guests: parseInt(guests),
            specialRequests,
            status
          }
        });

        return res.status(201).json({
          success: true,
          data: reservation
        });
      }
    } else if (path.length === 1) {
      // Operations on specific reservation by ID
      const reservationId = path[0];

      if (req.method === 'GET') {
        // GET /api/reservations-complete?path={id}
        const reservation = await prisma.reservation.findUnique({
          where: { id: reservationId }
        });

        if (!reservation) {
          return res.status(404).json({
            success: false,
            error: 'Reservation not found'
          });
        }

        return res.status(200).json({
          success: true,
          data: reservation
        });

      } else if (req.method === 'PUT') {
        // PUT /api/reservations-complete?path={id}
        const {
          customerName,
          customerEmail,
          customerPhone,
          date,
          time,
          guests,
          specialRequests,
          status
        } = req.body;

        // Check if reservation exists
        const existingReservation = await prisma.reservation.findUnique({
          where: { id: reservationId }
        });

        if (!existingReservation) {
          return res.status(404).json({
            success: false,
            error: 'Reservation not found'
          });
        }

        // Prepare update data
        const updateData = {};
        if (customerName !== undefined) updateData.customerName = customerName;
        if (customerEmail !== undefined) updateData.customerEmail = customerEmail;
        if (customerPhone !== undefined) updateData.customerPhone = customerPhone;
        if (date !== undefined) updateData.date = new Date(date);
        if (time !== undefined) updateData.time = time;
        if (guests !== undefined) updateData.guests = parseInt(guests);
        if (specialRequests !== undefined) updateData.specialRequests = specialRequests;
        if (status !== undefined) updateData.status = status;

        // Update the reservation
        const reservation = await prisma.reservation.update({
          where: { id: reservationId },
          data: updateData
        });

        return res.status(200).json({
          success: true,
          data: reservation
        });

      } else if (req.method === 'DELETE') {
        // DELETE /api/reservations-complete?path={id}
        const reservation = await prisma.reservation.findUnique({
          where: { id: reservationId }
        });

        if (!reservation) {
          return res.status(404).json({
            success: false,
            error: 'Reservation not found'
          });
        }

        await prisma.reservation.delete({
          where: { id: reservationId }
        });

        return res.status(200).json({
          success: true,
          message: 'Reservation deleted successfully'
        });
      }
    }

    // Method not allowed
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });

  } catch (error) {
    console.error('Reservations API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  } finally {
    await prisma.$disconnect();
  }
}