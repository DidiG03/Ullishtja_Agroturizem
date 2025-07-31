# WhatsApp Integration Setup Guide

## Overview
Your reservation system now automatically sends WhatsApp notifications when customers make reservations. You have three options to set this up:

## Option 1: Twilio WhatsApp API (Recommended for Production)

### Setup Steps:
1. **Sign up for Twilio**: Go to [https://www.twilio.com/console](https://www.twilio.com/console)
2. **Get your credentials**: Find your Account SID and Auth Token in the console
3. **Set up WhatsApp**: Enable WhatsApp messaging in your Twilio console
4. **Add environment variables** to your `.env` file:
   ```
   TWILIO_ACCOUNT_SID="your_account_sid_here"
   TWILIO_AUTH_TOKEN="your_auth_token_here"
   TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"
   ```

### Costs:
- WhatsApp messages: ~$0.005-0.02 per message
- Perfect for production use

## Option 2: Webhook Integration (Easiest Setup)

### Using Zapier:
1. **Create a Zapier account**: Go to [https://zapier.com](https://zapier.com)
2. **Create a new Zap**:
   - Trigger: "Webhooks by Zapier" - "Catch Hook"
   - Action: "WhatsApp Business" or "Twilio" - "Send Message"
3. **Get your webhook URL** from Zapier
4. **Add to your `.env` file**:
   ```
   WHATSAPP_WEBHOOK_URL="https://hooks.zapier.com/hooks/catch/xxxxx/xxxxx"
   ```

### Using Make.com (formerly Integromat):
1. **Create a Make.com account**: Go to [https://make.com](https://make.com)
2. **Create a scenario** with Webhook → WhatsApp
3. **Use the webhook URL** in your environment variables

### Using IFTTT:
1. **Create an IFTTT account**: Go to [https://ifttt.com](https://ifttt.com)
2. **Create an applet**: Webhooks → WhatsApp/Telegram/SMS
3. **Use the webhook URL** in your environment variables

## Option 3: WhatsApp Business API (Enterprise)

### Setup Steps:
1. **Apply for WhatsApp Business API**: Go to [https://business.whatsapp.com/products/whatsapp-business-api](https://business.whatsapp.com/products/whatsapp-business-api)
2. **Get approval from Meta** (can take several weeks)
3. **Set up your business account**
4. **Add environment variables**:
   ```
   WHATSAPP_PHONE_NUMBER_ID="your_phone_number_id"
   WHATSAPP_ACCESS_TOKEN="your_access_token"
   WHATSAPP_BUSINESS_ACCOUNT_ID="your_business_account_id"
   ```

## Current Status (No Setup Required)

**Good news!** Even without any setup, your system is already working:

1. **Email notifications**: Continue working as before ✅
2. **WhatsApp messages**: Will be logged to your server console for now
3. **Frontend WhatsApp**: Still works with the manual redirect method ✅

## Environment Variables Template

Add these to your `.env` file (choose the option that works for you):

```bash
# Database
DATABASE_URL="your_database_url_here"

# EmailJS (already configured)
EMAILJS_SERVICE_ID="service_87bng5p"
EMAILJS_TEMPLATE_ID="template_zajptmj"
EMAILJS_PUBLIC_KEY="4W-56GmbTJNSm3Efs"

# WhatsApp Integration (choose one option)

# Option 1: Twilio
TWILIO_ACCOUNT_SID="your_twilio_account_sid"
TWILIO_AUTH_TOKEN="your_twilio_auth_token"
TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"

# Option 2: Webhook
WHATSAPP_WEBHOOK_URL="https://hooks.zapier.com/hooks/catch/xxxxx/xxxxx"

# Option 3: WhatsApp Business API
WHATSAPP_PHONE_NUMBER_ID="your_phone_number_id"
WHATSAPP_ACCESS_TOKEN="your_access_token"
WHATSAPP_BUSINESS_ACCOUNT_ID="your_business_account_id"
```

## Testing

### To test the WhatsApp integration:

1. **Make a test reservation** on your website
2. **Check your server logs** to see the WhatsApp message being processed
3. **If configured properly**, you should receive a WhatsApp message at +4407312706087

### Message Format
The WhatsApp message will look like this:
```
🍽️ NEW RESERVATION REQUEST
━━━━━━━━━━━━━━━━━━━━━━

👤 Customer: John Doe
📧 Email: john@example.com
📞 Phone: +44123456789

📅 Date: 25/12/2024
🕐 Time: 19:30
👥 Guests: 4

💬 Special Requests:
Window table please

━━━━━━━━━━━━━━━━━━━━━━
Sent automatically from Ullishtja Website
```

## Troubleshooting

### Check Server Logs
Look for these messages in your server console:
- `WhatsApp sent via Twilio: [message_id]` ✅ Success
- `WhatsApp sent via webhook` ✅ Success  
- `WhatsApp message to send: [message]` ⚠️ No API configured (but logged)
- `WhatsApp notification failed: [error]` ❌ Error

### Common Issues
1. **Environment variables not loaded**: Restart your server after adding `.env` variables
2. **Twilio errors**: Check your Account SID and Auth Token
3. **Webhook errors**: Test your webhook URL manually

## Recommendation

For immediate setup, I recommend **Option 2 (Webhook with Zapier)**:
- Quick 5-minute setup
- No coding required
- Free tier available
- Works immediately
- Can easily switch to Twilio later for production

Would you like me to walk you through setting up any of these options? 