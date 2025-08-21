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

async function sendFeeReminderEmail(to, studentName, customerId) {
  try {
    console.log('📧 [FEE-REMINDER] Starting fee reminder check for:', studentName, '(', customerId, ')');
    
    // Import models
    const Customer = require('../backend/models/Customer');
    const Payment = require('../backend/models/Payment');
    
    // Get current month and year
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-11
    const currentYear = now.getFullYear();
    
    console.log('📅 [FEE-REMINDER] Checking payments for:', currentMonth + 1, currentYear);
    
    // Get customer details
    const customer = await Customer.findOne({ contact_id: customerId });
    if (!customer) {
      console.log('❌ [FEE-REMINDER] Customer not found:', customerId);
      return { skipped: true, reason: 'Customer not found' };
    }
    
    console.log('👤 [FEE-REMINDER] Customer found:', customer.customer_name);
    console.log('💰 [FEE-REMINDER] Course fees:', customer.course_fees);
    
    // Check if customer has paid for current month
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
    
    console.log('📅 [FEE-REMINDER] Checking payments between:', startOfMonth.toISOString(), 'and', endOfMonth.toISOString());
    
    const paymentsThisMonth = await Payment.find({
      customer_id: customerId,
      date: { $gte: startOfMonth, $lte: endOfMonth },
      payment_status: 'paid'
    });
    
    console.log('💳 [FEE-REMINDER] Payments found this month:', paymentsThisMonth.length);
    
    // Calculate total paid this month
    const totalPaidThisMonth = paymentsThisMonth.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    console.log('💰 [FEE-REMINDER] Total paid this month:', totalPaidThisMonth);
    
    // Check if they've paid enough for this month
    const monthlyFee = customer.course_fees || 0;
    const hasPaidForCurrentMonth = totalPaidThisMonth >= monthlyFee;
    
    console.log('📊 [FEE-REMINDER] Monthly fee:', monthlyFee);
    console.log('✅ [FEE-REMINDER] Has paid for current month:', hasPaidForCurrentMonth);
    
    if (hasPaidForCurrentMonth) {
      console.log('✅ [FEE-REMINDER] Skipping reminder - customer has already paid for current month');
      return { 
        skipped: true, 
        reason: 'Already paid for current month',
        totalPaid: totalPaidThisMonth,
        monthlyFee: monthlyFee
      };
    }
    
    // Calculate outstanding amount
    const outstandingAmount = Math.max(0, monthlyFee - totalPaidThisMonth);
    console.log('💸 [FEE-REMINDER] Outstanding amount:', outstandingAmount);
    
    if (outstandingAmount <= 0) {
      console.log('✅ [FEE-REMINDER] Skipping reminder - no outstanding amount');
      return { 
        skipped: true, 
        reason: 'No outstanding amount',
        totalPaid: totalPaidThisMonth,
        monthlyFee: monthlyFee
      };
    }
    
    // Prepare email content
    const course = customer.cf_pgdca_course || 'Not specified';
    const batch = customer.cf_batch_name || 'Not specified';
    
    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL || 'no-reply@yourdomain.com',
      subject: 'Fee Payment Reminder - Dream Institute',
      text: `Dear ${studentName},\n\nThis is a gentle reminder that your course fee for ${new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} is due.\n\nCourse: ${course}\nBatch: ${batch}\nMonthly Fee: ₹${monthlyFee.toLocaleString()}\nAmount Paid This Month: ₹${totalPaidThisMonth.toLocaleString()}\nOutstanding Amount: ₹${outstandingAmount.toLocaleString()}\n\nPlease make the payment at the earliest to avoid any inconvenience.\n\nThank you!\n\nDream Institute Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; text-align: center;">💰 Fee Payment Reminder</h2>
          <p>Dear <b>${studentName}</b>,</p>
          <p>This is a gentle reminder that your course fee for <b>${new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</b> is due.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Course Details:</h3>
            <p><b>Course:</b> ${course}</p>
            <p><b>Batch:</b> ${batch}</p>
            <p><b>Monthly Fee:</b> ₹${monthlyFee.toLocaleString()}</p>
            <p><b>Amount Paid This Month:</b> ₹${totalPaidThisMonth.toLocaleString()}</p>
            <p><b>Outstanding Amount:</b> <span style="color: #dc3545; font-weight: bold;">₹${outstandingAmount.toLocaleString()}</span></p>
          </div>
          
          <p>Please make the payment at the earliest to avoid any inconvenience.</p>
          <p>Thank you!</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">Dream Institute Team<br>Email sent at: ${new Date().toLocaleString()}</p>
        </div>
      `
    };
    
    console.log('📤 [FEE-REMINDER] Sending reminder email...');
    const result = await sgMail.send(msg);
    
    console.log('✅ [FEE-REMINDER] Reminder email sent successfully');
    console.log('📊 [FEE-REMINDER] Status Code:', result[0]?.statusCode);
    console.log('🆔 [FEE-REMINDER] Message ID:', result[0]?.headers?.['x-message-id']);
    
    return {
      sent: true,
      outstandingAmount: outstandingAmount,
      monthlyFee: monthlyFee,
      totalPaid: totalPaidThisMonth,
      course: course,
      batch: batch,
      result: result
    };
    
  } catch (error) {
    console.error('❌ [FEE-REMINDER] Failed to send fee reminder:');
    console.error('❌ [FEE-REMINDER] Error:', error.message);
    
    if (error.response) {
      console.error('❌ [FEE-REMINDER] Response Status:', error.response.status);
      console.error('❌ [FEE-REMINDER] Response Body:', JSON.stringify(error.response.body, null, 2));
    }
    
    throw error;
  }
}

module.exports = { sendOtpEmail, sendPasswordResetEmail, sendFeeReminderEmail }; 