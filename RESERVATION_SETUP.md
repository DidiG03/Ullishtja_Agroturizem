# 🍽️ Reservation System Setup Guide

Your restaurant website now has a **complete reservation system** that sends notifications via **Email** and **WhatsApp**! Here's how to set it up:

## 📧 **Email Setup (EmailJS)**

### Step 1: Create EmailJS Account
1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Sign up for a free account
3. Verify your email address

### Step 2: Create Email Service
1. In EmailJS dashboard, go to "Email Services"
2. Click "Add New Service"
3. Choose your email provider (Gmail, Outlook, etc.)
4. Follow the setup instructions
5. **Copy the Service ID** (e.g., `service_abc123`)

### Step 3: Create Email Template
1. Go to "Email Templates"
2. Click "Create New Template"
3. Use this template content:

```html
Subject: 🍽️ New Reservation Request - Ullishtja Agriturizem

Hello {{restaurant_name}},

You have received a new reservation request:

═══════════════════════════════
📋 RESERVATION DETAILS
═══════════════════════════════

👤 Customer Name: {{customer_name}}
📧 Email: {{customer_email}}
📞 Phone: {{customer_phone}}

📅 Date: {{reservation_date}}
🕐 Time: {{reservation_time}}
👥 Number of Guests: {{guest_count}}

💬 Special Requests:
{{special_requests}}

═══════════════════════════════

Please contact the customer to confirm the reservation.

Best regards,
Ullishtja Website System
```

4. **Copy the Template ID** (e.g., `template_xyz789`)

### Step 4: Get Public Key
1. Go to "Account" → "General"
2. **Copy your Public Key** (e.g., `abcdef123456`)

### Step 5: Update Configuration
Edit `src/reservationService.js` and replace:

```javascript
const EMAILJS_CONFIG = {
  serviceId: 'YOUR_SERVICE_ID',     // Replace with your Service ID
  templateId: 'YOUR_TEMPLATE_ID',   // Replace with your Template ID
  publicKey: 'YOUR_PUBLIC_KEY'      // Replace with your Public Key
};

const RESTAURANT_CONFIG = {
  email: 'your-restaurant@email.com',  // Replace with your email
  phone: '+355681234567',              // Replace with your WhatsApp number
  name: 'Ullishtja Agriturizem'
};
```

## 📱 **WhatsApp Setup**

### Option 1: WhatsApp Business (Recommended)
1. Download WhatsApp Business app
2. Use your restaurant phone number
3. Set up business profile with:
   - Business name: "Ullishtja Agriturizem"
   - Category: "Restaurant"
   - Description: Your restaurant description
   - Address: Your restaurant address

### Option 2: Regular WhatsApp
1. Just use your existing WhatsApp number
2. Make sure the number in `RESTAURANT_CONFIG.phone` matches your WhatsApp number

### Update Phone Number
In `src/reservationService.js`, update:
```javascript
phone: '+355681234567', // Replace with your actual WhatsApp number
```

**Format:** Include country code (e.g., +355 for Albania)

## 🎯 **How It Works**

### For Customers:
1. Customer fills out reservation form
2. Clicks "Book Table"
3. System attempts to send email first
4. If email fails or as backup, opens WhatsApp with pre-filled message
5. Customer gets confirmation message

### For You (Restaurant):
1. **Email**: You receive formatted email with all reservation details
2. **WhatsApp**: Customer's WhatsApp opens with reservation message ready to send
3. You can respond to confirm the reservation

## 🚀 **Testing**

### Test Email:
1. Make sure EmailJS is configured correctly
2. Fill out a test reservation
3. Check your email inbox

### Test WhatsApp:
1. The WhatsApp option always works
2. It opens customer's WhatsApp with your number
3. Message is pre-formatted with reservation details

## 🔧 **Customization Options**

### Change Notification Method:
In `src/App.js`, find this line:
```javascript
const result = await handleReservation(formData, 'both');
```

Options:
- `'email'` - Email only
- `'whatsapp'` - WhatsApp only  
- `'both'` - Try email first, WhatsApp as backup

### Customize WhatsApp Message:
Edit the message format in `src/reservationService.js` in the `sendToWhatsApp` function.

### Add More Validation:
Modify `validateReservationForm` function to add custom validation rules.

## 📞 **Support**

- **EmailJS Issues**: Check [EmailJS Documentation](https://www.emailjs.com/docs/)
- **WhatsApp Issues**: Ensure phone number format is correct (+country_code_number)

## ✅ **Quick Checklist**

- [ ] EmailJS account created
- [ ] Email service configured
- [ ] Email template created
- [ ] Configuration updated in `reservationService.js`
- [ ] WhatsApp number updated
- [ ] Test reservation sent
- [ ] Email received successfully
- [ ] WhatsApp message works

Your reservation system is now ready! 🎉 