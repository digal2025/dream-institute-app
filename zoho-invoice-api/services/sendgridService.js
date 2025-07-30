const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendOtpEmail(to, otp) {
  console.log('📧 [SENDGRID] Preparing OTP email...');
  console.log('📧 [SENDGRID] To:', to);
  console.log('📧 [SENDGRID] From:', process.env.SENDGRID_FROM_EMAIL);
  console.log('🔢 [SENDGRID] OTP:', otp);
  
  // Validate environment variables
  if (!process.env.SENDGRID_API_KEY) {
    throw new Error('SENDGRID_API_KEY is not configured');
  }
  
  if (!process.env.SENDGRID_FROM_EMAIL) {
    throw new Error('SENDGRID_FROM_EMAIL is not configured');
  }
  
  const msg = {
    to,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: 'Your Dream Institute OTP - Password Reset',
    text: `Your OTP for password reset is: ${otp}\n\nThis code is valid for 5 minutes.\n\nIf you did not request this, please ignore this email.\n\nDream Institute Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333; text-align: center;">🔐 Dream Institute Password Reset</h2>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="font-size: 16px; margin-bottom: 10px;">Your OTP for password reset is:</p>
          <div style="text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #007bff; background: #e7f3ff; padding: 10px 20px; border-radius: 8px; letter-spacing: 3px;">${otp}</span>
          </div>
          <p style="color: #666; font-size: 14px; text-align: center;">This code is valid for <strong>5 minutes</strong></p>
        </div>
        <p style="color: #666; font-size: 14px;">If you did not request this password reset, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">Dream Institute Team<br>Email sent at: ${new Date().toLocaleString()}</p>
      </div>
    `,
  };
  
  console.log('📤 [SENDGRID] Sending email via SendGrid...');
  
  try {
    const result = await sgMail.send(msg);
    console.log('✅ [SENDGRID] Email sent successfully');
    console.log('📊 [SENDGRID] Status Code:', result[0]?.statusCode);
    console.log('🆔 [SENDGRID] Message ID:', result[0]?.headers?.['x-message-id']);
    return result;
  } catch (error) {
    console.error('❌ [SENDGRID] Failed to send email:');
    console.error('❌ [SENDGRID] Error:', error.message);
    
    if (error.response) {
      console.error('❌ [SENDGRID] Response Status:', error.response.status);
      console.error('❌ [SENDGRID] Response Body:', JSON.stringify(error.response.body, null, 2));
    }
    
    throw error;
  }
}

async function sendPasswordResetEmail(to, resetUrl) {
  const msg = {
    to,
    from: process.env.SENDGRID_FROM_EMAIL || 'no-reply@yourdomain.com',
    subject: 'Reset your Dream Institute password',
    text: `Click the link to reset your password: ${resetUrl}`,
    html: `<p>Click the link below to reset your password:<br><a href="${resetUrl}">${resetUrl}</a><br>This link is valid for 15 minutes.</p>`
  };
  return sgMail.send(msg);
}

async function sendFeeReminderEmail(to, studentName, outstandingAmount, course, batch) {
  const msg = {
    to,
    from: process.env.SENDGRID_FROM_EMAIL || 'no-reply@yourdomain.com',
    subject: 'Fee Payment Reminder - Dream Institute',
    text: `Dear ${studentName},\n\nThis is a gentle reminder that your course fee is due.\n\nCourse: ${course}\nBatch: ${batch}\nOutstanding Amount: ₹${outstandingAmount}\n\nPlease make the payment at the earliest to avoid any inconvenience.\n\nIf you have already paid, please ignore this message.\n\nThank you!`,
    html: `<p>Dear <b>${studentName}</b>,<br><br>This is a gentle reminder that your course fee is due.<br><br><b>Course:</b> ${course}<br><b>Batch:</b> ${batch}<br><b>Outstanding Amount:</b> ₹${outstandingAmount}<br><br>Please make the payment at the earliest to avoid any inconvenience.<br><br>If you have already paid, please ignore this message.<br><br>Thank you!</p>`
  };
  return sgMail.send(msg);
}

module.exports = { sendOtpEmail, sendPasswordResetEmail, sendFeeReminderEmail }; 