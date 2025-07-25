const twilio = require('twilio');

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Send WhatsApp reminder to a student about unpaid fees for current month
 * @param {string} phoneNumber - Student's phone number (with country code)
 * @param {string} studentName - Student's name
 * @param {number} outstandingAmount - Outstanding amount
 * @param {string} course - Student's course
 * @param {string} batch - Student's batch
 * @returns {Promise} - Twilio message response
 */
async function sendFeeReminder(phoneNumber, studentName, outstandingAmount, course, batch) {
  try {
    // Format the phone number (ensure it has country code)
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
    
    // Get current month name
    const now = new Date();
    const monthName = now.toLocaleString('default', { month: 'long' });
    const year = now.getFullYear();
    
    // Create the WhatsApp message
    const message = `Dear ${studentName},

Your fee payment for ${monthName} ${year} for ${course} (${batch}) is pending.

Please complete your payment at the earliest to avoid any inconvenience.

For any queries, please contact us.

Best regards,
Dream Institute`;

    // Check if WhatsApp is properly configured
    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;
    if (!whatsappNumber) {
      throw new Error('TWILIO_WHATSAPP_NUMBER not configured');
    }

    console.log(`Attempting to send WhatsApp message from ${whatsappNumber} to ${formattedPhone}`);

    // Send WhatsApp message via Twilio
    const response = await client.messages.create({
      body: message,
      from: `whatsapp:${whatsappNumber}`,
      to: `whatsapp:+91${phoneNumber.replace(/^\+?91/, '').replace(/\D/g, '')}`
    });

    console.log(`WhatsApp message sent successfully to ${studentName} (${formattedPhone}): ${response.sid}`);
    return {
      success: true,
      messageId: response.sid,
      status: response.status,
      channel: 'whatsapp'
    };

  } catch (error) {
    console.error(`WhatsApp failed for ${studentName} (${phoneNumber}):`, error.message);
    
    // If WhatsApp fails, try SMS as fallback
    if (error.message.includes('Channel') || error.message.includes('From address')) {
      console.log(`Attempting SMS fallback for ${studentName}`);
      return await sendSMSFallback(phoneNumber, studentName, outstandingAmount, course, batch);
    }
    
    return {
      success: false,
      error: error.message,
      channel: 'whatsapp'
    };
  }
}

/**
 * SMS fallback function when WhatsApp fails
 */
async function sendSMSFallback(phoneNumber, studentName, outstandingAmount, course, batch) {
  try {
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
    
    const now = new Date();
    const monthName = now.toLocaleString('default', { month: 'long' });
    const year = now.getFullYear();
    
    const message = `Dear ${studentName}, Your fee payment for ${monthName} ${year} for ${course} (${batch}) is pending. Please complete your payment at the earliest. Best regards, Your Institution`;

    // Use regular SMS (requires TWILIO_PHONE_NUMBER)
    const smsNumber = process.env.TWILIO_PHONE_NUMBER;
    if (!smsNumber) {
      throw new Error('SMS fallback not available - TWILIO_PHONE_NUMBER not configured');
    }

    const response = await client.messages.create({
      body: message,
      from: smsNumber,
      to: formattedPhone
    });

    console.log(`SMS fallback sent successfully to ${studentName} (${formattedPhone}): ${response.sid}`);
    return {
      success: true,
      messageId: response.sid,
      status: response.status,
      channel: 'sms_fallback'
    };

  } catch (error) {
    console.error(`SMS fallback also failed for ${studentName}:`, error.message);
    return {
      success: false,
      error: `WhatsApp failed: ${error.message}`,
      channel: 'both_failed'
    };
  }
}

/**
 * Send bulk WhatsApp reminders to all unpaid students
 * @param {Array} unpaidStudents - Array of unpaid student objects
 * @returns {Promise} - Results of all WhatsApp attempts
 */
async function sendBulkFeeReminders(unpaidStudents) {
  const results = [];
  
  for (const student of unpaidStudents) {
    // Skip if no phone number
    if (!student.phone) {
      results.push({
        studentId: student.contact_id,
        studentName: student.customer_name,
        success: false,
        error: 'No phone number available'
      });
      continue;
    }

    const result = await sendFeeReminder(
      student.phone,
      student.customer_name,
      Number(student.outstanding_receivable_amount) || 0,
      student.cf_pgdca_course || 'Course',
      student.cf_batch_name || 'Batch'
    );

    results.push({
      studentId: student.contact_id,
      studentName: student.customer_name,
      phone: student.phone,
      ...result
    });

    // Add a small delay between messages to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
}

/**
 * Send custom WhatsApp message
 * @param {string} phoneNumber - Recipient's phone number
 * @param {string} message - Custom message content
 * @returns {Promise} - Twilio message response
 */
async function sendCustomWhatsApp(phoneNumber, message) {
  try {
    const formattedPhone = `+91${phoneNumber.replace(/^\+?91/, '').replace(/\D/g, '')}`;
    const response = await client.messages.create({
      body: message,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${formattedPhone}`
    });
    console.log(`Custom WhatsApp message sent successfully to ${formattedPhone}: ${response.sid}`);
    return {
      success: true,
      messageId: response.sid,
      status: response.status
    };
  } catch (error) {
    console.error(`Failed to send custom WhatsApp message to ${phoneNumber}:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send WhatsApp OTP to a student
 * @param {string} phoneNumber - Student's phone number (with country code)
 * @param {string} otp - The OTP to send
 * @returns {Promise}
 */
async function sendWhatsAppOTP(phoneNumber, otp) {
  try {
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;
    if (!whatsappNumber) throw new Error('TWILIO_WHATSAPP_NUMBER not configured');
    const message = `Your Dream Institute OTP is: ${otp}\nThis code is valid for 5 minutes.`;
    const response = await client.messages.create({
      body: message,
      from: `whatsapp:${whatsappNumber}`,
      to: `whatsapp:${formattedPhone}`
    });
    return { success: true, messageId: response.sid, status: response.status };
  } catch (error) {
    console.error(`Failed to send WhatsApp OTP to ${phoneNumber}:`, error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendFeeReminder,
  sendBulkFeeReminders,
  sendCustomWhatsApp,
  sendWhatsAppOTP,
};