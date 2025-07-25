const express = require('express');
const { sendFeeReminderEmail } = require('../services/sendgridService');
const { sendCustomWhatsApp } = require('../services/twilioService');
const Customer = require('../backend/models/Customer');
const router = express.Router();

/**
 * GET /api/sms/unpaid-students
 * Get list of students who haven't paid for the current month
 */
router.get('/unpaid-students', async (req, res) => {
  try {
    // Support custom month via query param, else use current month
    let { month } = req.query;
    let now = new Date();
    let year, monthNum;
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      [year, monthNum] = month.split('-').map(Number);
    } else {
      year = now.getFullYear();
      monthNum = now.getMonth() + 1;
      month = `${year}-${String(monthNum).padStart(2, '0')}`;
    }
    // Get all students
    const allStudents = await Customer.find({}).select('customer_name email phone outstanding_receivable_amount cf_pgdca_course cf_batch_name contact_id');
    // Get payments for the selected month (using 'date' field)
    const Payment = require('../backend/models/Payment');
    const monthStart = new Date(year, monthNum - 1, 1);
    const monthEnd = new Date(year, monthNum, 1);
    const monthPayments = await Payment.find({
      date: {
        $gte: monthStart,
        $lt: monthEnd
      }
    }).select('customer_id amount');
    // Create a set of students who have paid this month
    const paidStudentIds = new Set();
    monthPayments.forEach(payment => {
      paidStudentIds.add(payment.customer_id);
    });
    // Filter students who haven't paid this month
    const unpaidThisMonth = allStudents.filter(student => {
      const studentId = student.contact_id || student.customer_id;
      return !paidStudentIds.has(studentId);
    });
    // Filter out students without email addresses
    const studentsWithEmail = unpaidThisMonth.filter(student => student.email);
    res.json({
      success: true,
      currentMonth: month,
      totalStudents: allStudents.length,
      totalUnpaidThisMonth: unpaidThisMonth.length,
      withEmailAddresses: studentsWithEmail.length,
      students: studentsWithEmail
    });
  } catch (error) {
    console.error('Error fetching unpaid students for current month:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unpaid students for current month'
    });
  }
});

/**
 * POST /api/sms/send-reminder
 * Send WhatsApp fee reminder to a specific student
 */
router.post('/send-reminder', async (req, res) => {
  try {
    const { studentId, studentName, course, batch } = req.body;
    // Find student by ID to get email and outstanding amount
    const student = await Customer.findOne({ contact_id: studentId });
    if (!student || !student.email) {
      return res.status(400).json({ success: false, error: 'Student email not found' });
    }
    const outstandingAmount = student.outstanding_receivable_amount || 0;
    await sendFeeReminderEmail(student.email, studentName, outstandingAmount, course, batch);
    res.json({ success: true, message: `Fee reminder email sent to ${student.email}.` });
  } catch (error) {
    console.error('Error sending fee reminder email:', error);
    res.status(500).json({ success: false, error: 'Failed to send fee reminder email' });
  }
});

/**
 * POST /api/sms/send-bulk-reminders
 * Send WhatsApp fee reminders to students who haven't paid for the current month
 */
router.post('/send-bulk-reminders', async (req, res) => {
  try {
    let { month } = req.body;
    let now = new Date();
    let year, monthNum;
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      [year, monthNum] = month.split('-').map(Number);
    } else {
      year = now.getFullYear();
      monthNum = now.getMonth() + 1;
      month = `${year}-${String(monthNum).padStart(2, '0')}`;
    }
    const allStudents = await Customer.find({ email: { $exists: true, $ne: null, $ne: '' } }).select('customer_name email outstanding_receivable_amount cf_pgdca_course cf_batch_name contact_id');
    const Payment = require('../backend/models/Payment');
    const monthStart = new Date(year, monthNum - 1, 1);
    const monthEnd = new Date(year, monthNum, 1);
    const monthPayments = await Payment.find({ date: { $gte: monthStart, $lt: monthEnd } }).select('customer_id amount');
    const paidStudentIds = new Set();
    monthPayments.forEach(payment => { paidStudentIds.add(payment.customer_id); });
    const unpaidThisMonth = allStudents.filter(student => {
      const studentId = student.contact_id || student.customer_id;
      return !paidStudentIds.has(studentId);
    });
    if (unpaidThisMonth.length === 0) {
      return res.json({ success: true, message: `No students found who haven't paid for ${month}`, month, results: [] });
    }
    let successful = 0, failed = 0;
    for (const student of unpaidThisMonth) {
      try {
        await sendFeeReminderEmail(student.email, student.customer_name, student.outstanding_receivable_amount || 0, student.cf_pgdca_course, student.cf_batch_name);
        successful++;
      } catch (err) {
        failed++;
      }
    }
    res.json({ success: true, message: `Bulk fee reminder emails sent for ${month}. ${successful} successful, ${failed} failed`, month, totalSent: unpaidThisMonth.length, successful, failed });
  } catch (error) {
    console.error('Error sending bulk fee reminder emails:', error);
    res.status(500).json({ success: false, error: 'Failed to send bulk fee reminder emails' });
  }
});

/**
 * POST /api/sms/send-custom
 * Send custom WhatsApp message
 */
router.post('/send-custom', async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and message are required'
      });
    }

    const result = await sendCustomWhatsApp(phoneNumber, message);

    if (result.success) {
      res.json({
        success: true,
        message: 'Custom WhatsApp message sent successfully',
        messageId: result.messageId,
        status: result.status
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('Error sending custom WhatsApp message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send custom WhatsApp message'
    });
  }
});

/**
 * GET /api/sms/status
 * Check WhatsApp service status and configuration
 */
router.get('/status', async (req, res) => {
  try {
    const hasTwilioConfig = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_NUMBER);
    
    res.json({
      success: true,
      service: 'Twilio WhatsApp',
      configured: hasTwilioConfig,
      whatsappNumber: hasTwilioConfig ? process.env.TWILIO_WHATSAPP_NUMBER : null,
      message: hasTwilioConfig ? 'WhatsApp service is ready' : 'WhatsApp service not configured'
    });

  } catch (error) {
    console.error('Error checking WhatsApp status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check WhatsApp status'
    });
  }
});

module.exports = router; 