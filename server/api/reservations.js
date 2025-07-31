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

    // Send WhatsApp notification (don't fail reservation if this fails)
    try {
      await sendWhatsAppNotification(reservationData);
    } catch (whatsappError) {
      console.error('WhatsApp notification failed:', whatsappError);
      // Continue with successful reservation response
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

// WhatsApp notification service
const sendWhatsAppNotification = async (reservationData) => {
  try {
    console.log('🔄 Starting WhatsApp notification process...');
    console.log('Environment check:', {
      hasTwilioSID: !!process.env.TWILIO_ACCOUNT_SID,
      hasTwilioToken: !!process.env.TWILIO_AUTH_TOKEN,
      twilioNumber: process.env.TWILIO_WHATSAPP_NUMBER
    });

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

    console.log('📱 Formatted WhatsApp message:', message);

    // Option 1: Use Twilio WhatsApp API (if configured)
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      console.log('✅ Twilio credentials found, attempting to send WhatsApp...');
      const apiUrl = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;
      // Back to WhatsApp Sandbox (working solution)
      const fromNumber = 'whatsapp:+14155238886'; // Twilio WhatsApp Sandbox
      const toNumber = 'whatsapp:+4407312706087'; // Restaurant WhatsApp
      
      console.log('💰 Using WhatsApp Sandbox (working solution):', { from: fromNumber, to: toNumber });
      
      console.log('📞 Twilio API call details:', {
        url: apiUrl,
        from: fromNumber,
        to: toNumber,
        bodyLength: message.length
      });

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: fromNumber,
          To: toNumber,
          Body: message,
        }),
      });

      console.log('📡 Twilio API response status:', response.status, response.statusText);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ WhatsApp sent via Twilio successfully:', result.sid);
        return { success: true, method: 'whatsapp', messageId: result.sid };
      } else {
        const errorData = await response.text();
        console.error('❌ Twilio API error:', response.status, errorData);
        throw new Error(`Twilio API error: ${response.status} - ${errorData}`);
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
        console.log('WhatsApp sent via webhook');
        return { success: true, method: 'webhook' };
      }
    }

    // Option 3: Log message for manual handling
    console.log('WhatsApp message to send:', message);
    return { success: true, method: 'logged' };

  } catch (error) {
    console.error('WhatsApp notification failed:', error);
    return { success: false, error: error.message };
  }
};

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