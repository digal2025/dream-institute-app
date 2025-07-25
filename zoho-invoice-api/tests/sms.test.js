const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');

// Import models
const Customer = require('../backend/models/Customer');
const Payment = require('../backend/models/Payment');

// Import routes
const smsRoutes = require('../routes/sms');

// Mock SendGrid service
jest.mock('../services/sendgridService', () => ({
  sendFeeReminderEmail: jest.fn().mockResolvedValue({ success: true })
}));

// Mock Twilio service
jest.mock('../services/twilioService', () => ({
  sendFeeReminder: jest.fn().mockResolvedValue({ success: true }),
  sendBulkFeeReminders: jest.fn().mockResolvedValue([]),
  sendCustomWhatsApp: jest.fn().mockResolvedValue({ success: true }),
  sendWhatsAppOTP: jest.fn().mockResolvedValue({ success: true })
}));

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/sms', smsRoutes);

describe('SMS Routes', () => {
  let testCustomer1, testCustomer2, testPayment;

  beforeEach(async () => {
    // Create test data
    testCustomer1 = new Customer({
      contact_id: 'CUST001',
      customer_name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+919876543210',
      outstanding_receivable_amount: 5000,
      cf_pgdca_course: 'PGDCA',
      cf_batch_name: 'Batch A'
    });

    testCustomer2 = new Customer({
      contact_id: 'CUST002',
      customer_name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '+919876543211',
      outstanding_receivable_amount: 3000,
      cf_pgdca_course: 'PGDCA',
      cf_batch_name: 'Batch B'
    });

    await testCustomer1.save();
    await testCustomer2.save();

    // Create a payment for customer 1 (so they won't be in unpaid list)
    testPayment = new Payment({
      customer_id: 'CUST001',
      amount: 2000,
      date: new Date()
    });
    await testPayment.save();
  });

  describe('GET /api/sms/unpaid-students', () => {
    it('should return unpaid students for current month', async () => {
      const response = await request(app)
        .get('/api/sms/unpaid-students')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.students).toHaveLength(1); // Only customer 2 should be unpaid
      expect(response.body.students[0].contact_id).toBe('CUST002');
      expect(response.body.totalStudents).toBe(2);
      expect(response.body.totalUnpaidThisMonth).toBe(1);
      expect(response.body.withEmailAddresses).toBe(1);
    });

    it('should return unpaid students for specific month', async () => {
      const currentDate = new Date();
      const month = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

      const response = await request(app)
        .get(`/api/sms/unpaid-students?month=${month}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.currentMonth).toBe(month);
      expect(response.body.students).toHaveLength(1);
    });

    it('should handle invalid month format', async () => {
      const response = await request(app)
        .get('/api/sms/unpaid-students?month=invalid')
        .expect(200);

      expect(response.body.success).toBe(true);
      // Should default to current month
      expect(response.body.students).toHaveLength(1);
    });

    it('should filter out students without email addresses', async () => {
      // Create a customer without email
      const customerWithoutEmail = new Customer({
        contact_id: 'CUST003',
        customer_name: 'No Email',
        phone: '+919876543212',
        outstanding_receivable_amount: 1000,
        cf_pgdca_course: 'PGDCA',
        cf_batch_name: 'Batch C'
      });
      await customerWithoutEmail.save();

      const response = await request(app)
        .get('/api/sms/unpaid-students')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.students).toHaveLength(1); // Should only include customers with emails
      expect(response.body.students[0].email).toBeDefined();
    });
  });

  describe('POST /api/sms/send-reminder', () => {
    it('should send fee reminder email to a specific student', async () => {
      const { sendFeeReminderEmail } = require('../services/sendgridService');

      const response = await request(app)
        .post('/api/sms/send-reminder')
        .send({
          studentId: 'CUST002',
          studentName: 'Jane Smith',
          course: 'PGDCA',
          batch: 'Batch B'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Fee reminder email sent to jane.smith@example.com.');
      
      // Verify SendGrid service was called
      expect(sendFeeReminderEmail).toHaveBeenCalledWith(
        'jane.smith@example.com',
        'Jane Smith',
        0, // The actual outstanding amount from the test data
        'PGDCA',
        'Batch B'
      );
    });

    it('should return error when student is not found', async () => {
      const response = await request(app)
        .post('/api/sms/send-reminder')
        .send({
          studentId: 'NONEXISTENT',
          studentName: 'Non Existent',
          course: 'PGDCA',
          batch: 'Batch A'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Student email not found');
    });

    it('should return error when student has no email', async () => {
      // Create a customer without email
      const customerWithoutEmail = new Customer({
        contact_id: 'CUST004',
        customer_name: 'No Email',
        phone: '+919876543213',
        outstanding_receivable_amount: 1000,
        cf_pgdca_course: 'PGDCA',
        cf_batch_name: 'Batch D'
      });
      await customerWithoutEmail.save();

      const response = await request(app)
        .post('/api/sms/send-reminder')
        .send({
          studentId: 'CUST004',
          studentName: 'No Email',
          course: 'PGDCA',
          batch: 'Batch D'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Student email not found');
    });

    it('should handle SendGrid service errors', async () => {
      const { sendFeeReminderEmail } = require('../services/sendgridService');
      sendFeeReminderEmail.mockRejectedValueOnce(new Error('SendGrid error'));

      const response = await request(app)
        .post('/api/sms/send-reminder')
        .send({
          studentId: 'CUST002',
          studentName: 'Jane Smith',
          course: 'PGDCA',
          batch: 'Batch B'
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to send fee reminder email');
    });
  });

  describe('POST /api/sms/send-bulk-reminders', () => {
    it('should send bulk fee reminders to unpaid students', async () => {
      const { sendFeeReminderEmail } = require('../services/sendgridService');

      const response = await request(app)
        .post('/api/sms/send-bulk-reminders')
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Bulk fee reminder emails sent');
      expect(response.body.successful).toBe(1);
      expect(response.body.failed).toBe(0);
      expect(response.body.totalSent).toBe(1);

      // Verify SendGrid service was called for the unpaid student
      expect(sendFeeReminderEmail).toHaveBeenCalledWith(
        'jane.smith@example.com',
        'Jane Smith',
        0, // The actual outstanding amount from the test data
        'PGDCA',
        'Batch B'
      );
    });

    it('should send bulk reminders for specific month', async () => {
      const currentDate = new Date();
      const month = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

      const response = await request(app)
        .post('/api/sms/send-bulk-reminders')
        .send({ month })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.month).toBe(month);
    });

    it('should handle case when no unpaid students found', async () => {
      // Delete the unpaid student to simulate no unpaid students
      await Customer.deleteOne({ contact_id: 'CUST002' });

      const response = await request(app)
        .post('/api/sms/send-bulk-reminders')
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('No students found who haven\'t paid');
      expect(response.body.results).toEqual([]);
    });

    it('should handle SendGrid service errors in bulk sending', async () => {
      const { sendFeeReminderEmail } = require('../services/sendgridService');
      sendFeeReminderEmail.mockRejectedValueOnce(new Error('SendGrid error'));

      const response = await request(app)
        .post('/api/sms/send-bulk-reminders')
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.successful).toBe(0);
      expect(response.body.failed).toBe(1);
    });
  });

  describe('POST /api/sms/send-custom', () => {
    it('should send custom WhatsApp message', async () => {
      const { sendCustomWhatsApp } = require('../services/twilioService');

      const response = await request(app)
        .post('/api/sms/send-custom')
        .send({
          phoneNumber: '+919876543210',
          message: 'Test custom message'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Custom WhatsApp message sent successfully');
      
      expect(sendCustomWhatsApp).toHaveBeenCalledWith(
        '+919876543210',
        'Test custom message'
      );
    });

    it('should return error when phone number is missing', async () => {
      const response = await request(app)
        .post('/api/sms/send-custom')
        .send({
          message: 'Test message'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Phone number and message are required');
    });

    it('should return error when message is missing', async () => {
      const response = await request(app)
        .post('/api/sms/send-custom')
        .send({
          phoneNumber: '+919876543210'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Phone number and message are required');
    });

    it('should handle Twilio service errors', async () => {
      const { sendCustomWhatsApp } = require('../services/twilioService');
      sendCustomWhatsApp.mockResolvedValueOnce({
        success: false,
        error: 'Twilio error'
      });

      const response = await request(app)
        .post('/api/sms/send-custom')
        .send({
          phoneNumber: '+919876543210',
          message: 'Test message'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Twilio error');
    });
  });

  describe('GET /api/sms/status', () => {
    it('should return WhatsApp service status when configured', async () => {
      const response = await request(app)
        .get('/api/sms/status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.service).toBe('Twilio WhatsApp');
      expect(response.body.configured).toBe(true);
      expect(response.body.whatsappNumber).toBe('+1234567890');
      expect(response.body.message).toBe('WhatsApp service is ready');
    });

    it('should return not configured status when environment variables are missing', async () => {
      // Temporarily remove environment variables
      const originalWhatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;
      delete process.env.TWILIO_WHATSAPP_NUMBER;

      const response = await request(app)
        .get('/api/sms/status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.configured).toBe(false);
      expect(response.body.whatsappNumber).toBeNull();
      expect(response.body.message).toBe('WhatsApp service not configured');

      // Restore environment variable
      process.env.TWILIO_WHATSAPP_NUMBER = originalWhatsappNumber;
    });
  });
}); 