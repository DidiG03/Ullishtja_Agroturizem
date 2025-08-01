import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// WhatsApp notification service
const sendWhatsAppNotification = async (reservationData) => {
  try {
    // Format the WhatsApp message
    const message = `🍽️ *NEW RESERVATION REQUEST*
━━━━━━━━━━━━━━━━━━━━━━

👤 *Customer:* ${reservationData.name}
📧 *Email:* ${reservationData.email}
📞 *Phone:* ${reservationData.phone}

📅 *Date:* ${new Date(reservationData.date).toLocaleDateString()}
🕐 *Time:* ${reservationData.time}
👥 *Guests:* ${reservationData.guests}

${reservationData.specialRequests ? `💬 *Special Requests:*\n${reservationData.specialRequests}` : ''}

━━━━━━━━━━━━━━━━━━━━━━
Sent automatically from Ullishtja Website`;

    // Option 1: Use Twilio WhatsApp API (if configured)
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886',
          To: 'whatsapp:+4407312706087', // Your restaurant WhatsApp number
          Body: message,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return { success: true, method: 'twilio', messageId: result.sid };
      }
    }

    // Option 2: Use webhook (Zapier, IFTTT, etc.)
    if (process.env.WHATSAPP_WEBHOOK_URL) {
      const response = await fetch(process.env.WHATSAPP_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          phone: '+4407312706087',
          reservationData
        }),
      });

      if (response.ok) {
        ('WhatsApp sent via webhook');
        return { success: true, method: 'webhook' };
      }
    }

    // Option 3: Log message for manual handling
    return { success: true, method: 'logged' };

  } catch (error) {
    console.error('WhatsApp notification failed:', error);
    return { success: false, error: error.message };
  }
};

import { applyCorsHeaders } from '../src/utils/corsConfig.js';
import { applySecurityHeaders } from '../src/utils/securityHeaders.js';
import { checkRateLimit } from '../src/utils/rateLimiter.js';
import { validateReservationData } from '../src/utils/inputValidation.js';

export default async function handler(req, res) {
  // Apply security headers
  applySecurityHeaders(res);
  
  // Apply CORS headers
  applyCorsHeaders(res, req.headers.origin);
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Rate limiting for reservation endpoint
  if (!checkRateLimit(req, res, 'reservations')) {
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
      // Validate and sanitize input data
      const validation = validateReservationData(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid reservation data',
          details: validation.errors
        });
      }
      
      const reservationData = validation.sanitizedData;
      
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

      // Send WhatsApp notification (don't fail reservation if this fails)
      try {
        await sendWhatsAppNotification(reservationData);
      } catch (whatsappError) {
        console.error('WhatsApp notification failed:', whatsappError);
        // Continue with successful reservation response
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