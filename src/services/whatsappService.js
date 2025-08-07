// WhatsApp Business API Service
// You can use services like Twilio, Vonage, or official WhatsApp Business API
// 
// NOTE: Currently WhatsApp notifications are handled server-side in the API endpoints.
// This service is available for frontend integrations if needed in the future.

const WHATSAPP_CONFIG = {
  // Option 1: Twilio WhatsApp API - Credentials moved to server-side for security
  twilio: {
    accountSid: null, // Handled server-side only
    authToken: null, // Handled server-side only
    whatsappNumber: 'whatsapp:+14155238886', // Public sandbox number only
  },
  
  // Option 2: Official WhatsApp Business API - Credentials moved to server-side for security
  whatsappBusiness: {
    phoneNumberId: null, // Handled server-side only
    accessToken: null, // Handled server-side only
    businessAccountId: null, // Handled server-side only
  },
  
  // Your restaurant WhatsApp number (public information)
  restaurantNumber: '+4407312706087'
};

// Send WhatsApp message using Twilio
export const sendWhatsAppViaTwilio = async (reservationData) => {
  try {
    // Note: You'll need to install twilio package
    // npm install twilio
    
    const message = formatReservationMessage(reservationData);
    
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${WHATSAPP_CONFIG.twilio.accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${WHATSAPP_CONFIG.twilio.accountSid}:${WHATSAPP_CONFIG.twilio.authToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: WHATSAPP_CONFIG.twilio.whatsappNumber,
        To: `whatsapp:${WHATSAPP_CONFIG.restaurantNumber}`,
        Body: message,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      return { success: true, messageId: result.sid };
    } else {
      throw new Error(`Twilio API error: ${response.statusText}`);
    }
  } catch (error) {
    console.error('WhatsApp via Twilio failed:', error);
    return { success: false, error: error.message };
  }
};

// Send WhatsApp message using official WhatsApp Business API
export const sendWhatsAppViaBusinessAPI = async (reservationData) => {
  try {
    const message = formatReservationMessage(reservationData);
    
    const response = await fetch(`https://graph.facebook.com/v17.0/${WHATSAPP_CONFIG.whatsappBusiness.phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_CONFIG.whatsappBusiness.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: WHATSAPP_CONFIG.restaurantNumber.replace('+', ''),
        type: 'text',
        text: { body: message }
      }),
    });

    if (response.ok) {
      const result = await response.json();
      return { success: true, messageId: result.messages[0].id };
    } else {
      throw new Error(`WhatsApp Business API error: ${response.statusText}`);
    }
  } catch (error) {
    console.error('WhatsApp Business API failed:', error);
    return { success: false, error: error.message };
  }
};

// Send WhatsApp message using a webhook service like Zapier or IFTTT
export const sendWhatsAppViaWebhook = async (reservationData) => {
  try {
    const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL;
    
    if (!webhookUrl) {
      throw new Error('WHATSAPP_WEBHOOK_URL not configured');
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: formatReservationMessage(reservationData),
        phone: WHATSAPP_CONFIG.restaurantNumber,
        reservationData
      }),
    });

    if (response.ok) {
      return { success: true, method: 'webhook' };
    } else {
      throw new Error(`Webhook failed: ${response.statusText}`);
    }
  } catch (error) {
    console.error('WhatsApp webhook failed:', error);
    return { success: false, error: error.message };
  }
};

// Format reservation data into WhatsApp message
const formatReservationMessage = (reservationData) => {
  return `🍽️ *NEW RESERVATION REQUEST*
━━━━━━━━━━━━━━━━━━━━━━

👤 *Customer:* ${reservationData.name}
📧 *Email:* ${reservationData.email}
📞 *Phone:* ${reservationData.phone}

📅 *Date:* ${reservationData.date}
🕐 *Time:* ${reservationData.time}
👥 *Guests:* ${reservationData.guests}

${reservationData.requests ? `💬 *Special Requests:*\n${reservationData.requests}` : ''}

━━━━━━━━━━━━━━━━━━━━━━
Sent automatically from Ullishtja Website`;
};

// Main function to send WhatsApp notification
export const sendWhatsAppNotification = async (reservationData) => {
  // Try different methods in order of preference
  const methods = [
    { name: 'Twilio', fn: sendWhatsAppViaTwilio },
    { name: 'Business API', fn: sendWhatsAppViaBusinessAPI },
    { name: 'Webhook', fn: sendWhatsAppViaWebhook }
  ];

  for (const method of methods) {
    try {
      const result = await method.fn(reservationData);
      if (result.success) {
        return result;
      }
    } catch (error) {
      console.warn(`${method.name} failed, trying next method:`, error.message);
    }
  }

  // If all methods fail, fallback to the browser redirect method
  console.warn('All WhatsApp API methods failed, falling back to browser redirect');
  return { success: false, error: 'All WhatsApp methods failed', fallback: true };
}; 