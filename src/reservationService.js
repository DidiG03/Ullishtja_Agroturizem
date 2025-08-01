import emailjs from '@emailjs/browser';
import { apiCall } from './utils/apiConfig';

// EmailJS Configuration - You'll need to set these up at https://www.emailjs.com/
const EMAILJS_CONFIG = {
  serviceId: 'service_87bng5p', // Replace with your EmailJS service ID
  templateId: 'template_zajptmj', // Replace with your EmailJS template ID
  publicKey: '4W-56GmbTJNSm3Efs' // Replace with your EmailJS public key
};

// Restaurant contact information
const RESTAURANT_CONFIG = {
  email: 'hi@ullishtja-agroturizem.com', // Restaurant email
  phone: '+4407312706087', // Replace with your WhatsApp number (include country code)
  name: 'Ullishtja Agriturizem'
};

// Initialize EmailJS
emailjs.init(EMAILJS_CONFIG.publicKey);

// Reservation Service using API calls
const reservationService = {
  async create(reservationData) {
    try {
      const result = await apiCall('/reservations', {
        method: 'POST',
        body: JSON.stringify(reservationData),
      });
      return result;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error creating reservation:', error);
      }
      return { success: false, error: error.message };
    }
  },

  async getAll(options = {}) {
    try {
      const params = new URLSearchParams(options);
      const result = await apiCall(`/reservations?${params}`);
      return result;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching reservations:', error);
      }
      return { success: false, error: error.message };
    }
  },

  async updateStatus(id, status) {
    try {
      const result = await apiCall(`/reservations/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      return result;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error updating reservation:', error);
      }
      return { success: false, error: error.message };
    }
  },
};

// Customer Service using API calls
const customerService = {
  async upsert(customerData) {
    // This is handled automatically in the reservation creation API
    return { success: true, data: customerData };
  },
};

// Send reservation via email
export const sendReservationEmail = async (reservationData) => {
  try {
    const templateParams = {
      to_email: RESTAURANT_CONFIG.email,
      customer_name: reservationData.name,
      customer_email: reservationData.email,
      customer_phone: reservationData.phone,
      reservation_date: reservationData.date,
      reservation_time: reservationData.time,
      guest_count: reservationData.guests,
      special_requests: reservationData.requests || 'None',
      restaurant_name: RESTAURANT_CONFIG.name
    };

    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      templateParams
    );

    return { success: true, response };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error };
  }
};

// Create WhatsApp message and redirect
export const sendToWhatsApp = (reservationData) => {
  const message = `
🍽️ *NEW RESERVATION REQUEST*
━━━━━━━━━━━━━━━━━━━━━━

👤 *Customer:* ${reservationData.name}
📧 *Email:* ${reservationData.email}
📞 *Phone:* ${reservationData.phone}

📅 *Date:* ${reservationData.date}
🕐 *Time:* ${reservationData.time}
👥 *Guests:* ${reservationData.guests}

${reservationData.requests ? `💬 *Special Requests:*\n${reservationData.requests}` : ''}

━━━━━━━━━━━━━━━━━━━━━━
Sent from Ullishtja Website
  `.trim();

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${RESTAURANT_CONFIG.phone.replace('+', '')}?text=${encodedMessage}`;
  
  // Open WhatsApp in new tab
  window.open(whatsappUrl, '_blank');
  
  return { success: true, url: whatsappUrl };
};

// Export the reservation service
export { reservationService };

// Main reservation handler
export const handleReservation = async (formData, preferredMethod = 'email') => {
  const reservationData = {
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    date: formData.get('date'),
    time: formData.get('time'),
    guests: parseInt(formData.get('guests')),
    specialRequests: formData.get('requests') || null
  };

  const results = {
    database: null,
    email: null,
    whatsapp: null,
    success: false
  };

  try {
    // Save to database first
    results.database = await reservationService.create(reservationData);
    
    if (results.database.success) {
      // Create or update customer record
      await customerService.upsert({
        name: reservationData.name,
        email: reservationData.email,
        phone: reservationData.phone,
      });

      // Send email notification to restaurant owner
      if (EMAILJS_CONFIG.serviceId !== 'YOUR_SERVICE_ID') {
        const emailData = {
          ...reservationData,
          requests: reservationData.specialRequests, // Map for email compatibility
          guests: reservationData.guests.toString()
        };
        results.email = await sendReservationEmail(emailData);
      }

      // Only redirect to WhatsApp if specifically requested (manual method)
      if (preferredMethod === 'whatsapp') {
        const whatsappData = {
          ...reservationData,
          requests: reservationData.specialRequests,
          guests: reservationData.guests.toString()
        };
        results.whatsapp = sendToWhatsApp(whatsappData);
      }

      // Success if database save was successful
      results.success = true;
    } else {
      throw new Error(results.database.error || 'Failed to save reservation');
    }
  } catch (error) {
    console.error('Reservation handling error:', error);
    results.success = false;
    results.error = error.message;
  }

  return results;
};

// Validate form data
export const validateReservationForm = (formData) => {
  const errors = [];
  
  if (!formData.get('name')?.trim()) {
    errors.push('Name is required');
  }
  
  if (!formData.get('email')?.trim()) {
    errors.push('Email is required');
  } else if (!/\S+@\S+\.\S+/.test(formData.get('email'))) {
    errors.push('Email is invalid');
  }
  
  if (!formData.get('phone')?.trim()) {
    errors.push('Phone is required');
  }
  
  if (!formData.get('date')) {
    errors.push('Date is required');
  }
  
  if (!formData.get('time')) {
    errors.push('Time is required');
  }
  
  if (!formData.get('guests')) {
    errors.push('Number of guests is required');
  }

  // Check if date is in the future
  const selectedDate = new Date(formData.get('date'));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (selectedDate < today) {
    errors.push('Reservation date must be in the future');
  }

  // Check if time is within restaurant hours (10:00 AM - 10:00 PM)
  const selectedTime = formData.get('time');
  if (selectedTime) {
    const [hours, minutes] = selectedTime.split(':').map(num => parseInt(num));
    const timeInMinutes = hours * 60 + minutes;
    const openTime = 10 * 60; // 10:00 AM in minutes
    const closeTime = 22 * 60; // 10:00 PM in minutes
    
    if (timeInMinutes < openTime || timeInMinutes > closeTime) {
      errors.push('Reservation time must be between 10:00 AM and 10:00 PM');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}; 