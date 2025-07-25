# WhatsApp Reminder Feature Setup Guide

## Overview
The WhatsApp reminder feature allows you to send automated fee payment reminders to students who haven't paid their fees. It uses Twilio's WhatsApp Business API as the messaging provider.

## Why WhatsApp?
- **Cost Effective**: ~$0.005 per message (vs $0.0075+ for SMS)
- **Higher Engagement**: Students are more likely to read WhatsApp messages
- **Rich Media Support**: Can send text, images, and documents
- **Global Reach**: Works in most countries
- **No Monthly Fees**: Pay only for messages sent

## Twilio WhatsApp Setup

### 1. Create a Twilio Account
1. Go to [Twilio.com](https://www.twilio.com) and sign up for a free account
2. You'll get $15-20 in free credit to start
3. Verify your phone number during signup

### 2. Get Your Twilio Credentials
1. Go to your [Twilio Console](https://console.twilio.com/)
2. Find your **Account SID** and **Auth Token** on the dashboard
3. Note down these credentials

### 3. Set Up WhatsApp Business API
1. In the Twilio Console, go to **Messaging** → **Try it out** → **Send a WhatsApp message**
2. You'll get a trial WhatsApp number (format: +14155238886)
3. Note down this WhatsApp number
4. **Important**: For production, you'll need to apply for a WhatsApp Business API number

### 4. Environment Configuration
Add these environment variables to your `.env` file:

```env
# Twilio WhatsApp Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_WHATSAPP_NUMBER=your_twilio_whatsapp_number_here
```

Example:
```env
TWILIO_ACCOUNT_SID=secret_key
TWILIO_AUTH_TOKEN=your_auth_token_from_twilio_console
TWILIO_WHATSAPP_NUMBER=+1112223334444
```

## Features

### 1. Individual WhatsApp Reminders
- Send reminders to specific students
- Shows student details and outstanding amount
- Individual send buttons for each student

### 2. Bulk WhatsApp Reminders
- Send reminders to all unpaid students at once
- Automatic filtering of students with phone numbers
- Progress tracking and success/failure reporting

### 3. Custom WhatsApp Messages
- Send custom messages to any phone number
- Useful for announcements or special notifications

## Usage

### From the Dashboard
1. Click the **"WhatsApp Reminders"** button in the main dashboard
2. View the list of unpaid students with phone numbers
3. Send individual reminders or bulk reminders to all

### API Endpoints
- `GET /api/sms/unpaid-students` - Get list of unpaid students
- `POST /api/sms/send-reminder` - Send reminder to specific student
- `POST /api/sms/send-bulk-reminders` - Send reminders to all unpaid students
- `POST /api/sms/send-custom` - Send custom WhatsApp message
- `GET /api/sms/status` - Check WhatsApp service status

## WhatsApp Message Format
The default fee reminder message includes:
- Student's name
- Current month and year
- Course and batch information
- Professional closing

Example:
```
Dear John Doe,

Your fee payment for December 2024 for PGDCA (Batch 1) is pending.

Please complete your payment at the earliest to avoid any inconvenience.

For any queries, please contact us.

Best regards,
Your Institution
```

## Cost Considerations
- **Twilio Free Trial**: $15-20 credit included
- **WhatsApp Messages**: ~$0.005 per message (much cheaper than SMS)
- **International**: Varies by country (check Twilio pricing)
- **No monthly fees**: Only pay for messages sent
- **Trial Limitations**: Trial accounts have some restrictions

## WhatsApp Business API Requirements

### Trial Account Limitations
- Can only send messages to verified numbers
- Limited to 1000 messages per month
- Messages must be initiated by the customer first (opt-in)

### Production Account
- Apply for WhatsApp Business API approval
- Can send messages to any verified number
- Higher message limits
- More features available

## Security Notes
- Keep your Twilio credentials secure
- Never commit `.env` files to version control
- Use environment variables for all sensitive data
- Monitor your Twilio usage to avoid unexpected charges

## Troubleshooting

### Common Issues
1. **"WhatsApp service not configured"** - Check your environment variables
2. **"Invalid phone number"** - Ensure phone numbers include country code
3. **"Authentication failed"** - Verify your Twilio credentials
4. **"Insufficient balance"** - Add credit to your Twilio account
5. **"Message not delivered"** - Recipient may not have opted in (trial accounts)

### Testing
1. Start with individual WhatsApp to test the setup
2. Use the status endpoint to verify configuration
3. Check Twilio console for message delivery status
4. For trial accounts, ensure recipients have opted in first

## WhatsApp vs SMS Comparison

| Feature | WhatsApp | SMS |
|---------|----------|-----|
| Cost per message | ~$0.005 | ~$0.0075+ |
| Delivery rate | Higher | Lower |
| Rich media | Yes | No |
| Read receipts | Yes | No |
| Setup complexity | Medium | Low |
| Global availability | Most countries | All countries |

## Support
- [Twilio WhatsApp Documentation](https://www.twilio.com/docs/whatsapp)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [Twilio Support](https://support.twilio.com/)
- Check the application logs for detailed error messages 