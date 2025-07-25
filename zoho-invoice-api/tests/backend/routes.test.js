const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');

// Import routes
const smsRoutes = require('../../routes/sms');
const mongoCustomersRoutes = require('../../routes/mongoCustomers');
const mongoPaymentsRoutes = require('../../routes/mongoPayments');
const mongoInvoicesRoutes = require('../../routes/mongoInvoices');
const notificationsRoutes = require('../../routes/notifications');
const authRoutes = require('../../backend/routes/auth');

// Import models
const Customer = require('../../backend/models/Customer');
const Payment = require('../../backend/models/Payment');
const Invoice = require('../../backend/models/Invoice');
const Notification = require('../../backend/models/Notification');
const User = require('../../backend/models/User');

// Import services
const sendgridService = require('../../services/sendgridService');

// Mock external services
jest.mock('../../services/sendgridService', () => ({
  sendFeeReminderEmail: jest.fn().mockResolvedValue({ success: true }),
  sendOtpEmail: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock('../../services/twilioService', () => ({
  sendFeeReminder: jest.fn().mockResolvedValue({ success: true }),
  sendBulkFeeReminders: jest.fn().mockResolvedValue([]),
  sendCustomWhatsApp: jest.fn().mockResolvedValue({ success: true }),
  sendWhatsAppOTP: jest.fn().mockResolvedValue({ success: true })
}));

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/sms', smsRoutes);
app.use('/api/customers', mongoCustomersRoutes);
app.use('/api/payments', mongoPaymentsRoutes);
app.use('/api/invoices', mongoInvoicesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/auth', authRoutes);

describe('Backend Routes', () => {
  let testCustomer, testPayment, testInvoice, testNotification;

  beforeEach(async () => {
    // Create test data
    testCustomer = new Customer({
      contact_id: 'CUST001',
      customer_name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+919876543210',
      outstanding_receivable_amount: 5000,
      cf_pgdca_course: 'PGDCA',
      cf_batch_name: 'Batch A'
    });

    testPayment = new Payment({
      customer_id: 'CUST001',
      amount: 2000,
      date: new Date(),
      payment_method: 'Cash',
      reference_number: 'REF001'
    });

    testInvoice = new Invoice({
      invoice_id: 'INV001',
      customer_id: 'CUST001',
      amount: 5000,
      date: new Date(),
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'pending'
    });

    testNotification = new Notification({
      user_id: 'USER001',
      title: 'Test Notification',
      message: 'This is a test notification',
      type: 'info',
      is_read: false
    });

    await testCustomer.save();
    await testPayment.save();
    await testInvoice.save();
    await testNotification.save();
  });

  describe('Customer Routes', () => {
    describe('GET /api/customers', () => {
      it('should get all customers', async () => {
        const response = await request(app)
          .get('/api/customers')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.customers)).toBe(true);
        expect(response.body.customers.length).toBeGreaterThan(0);
        expect(response.body.customers[0].customer_name).toBe('John Doe');
      });

      it('should get customers with pagination', async () => {
        const response = await request(app)
          .get('/api/customers?page=1&limit=10')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.customers).toBeDefined();
        expect(response.body.pagination).toBeDefined();
      });

      it('should search customers by name', async () => {
        const response = await request(app)
          .get('/api/customers?search=John')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.customers.length).toBeGreaterThan(0);
        expect(response.body.customers[0].customer_name).toContain('John');
      });

      it('should filter customers by course', async () => {
        const response = await request(app)
          .get('/api/customers?course=PGDCA')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.customers.length).toBeGreaterThan(0);
        expect(response.body.customers[0].cf_pgdca_course).toBe('PGDCA');
      });
    });

    describe('GET /api/customers/:id', () => {
      it('should get customer by ID', async () => {
        const response = await request(app)
          .get(`/api/customers/${testCustomer.contact_id}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.customer.customer_name).toBe('John Doe');
        expect(response.body.customer.email).toBe('john.doe@example.com');
      });

      it('should return 404 for non-existent customer', async () => {
        const response = await request(app)
          .get('/api/customers/NONEXISTENT')
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Customer not found');
      });
    });

    describe('POST /api/customers', () => {
      it('should create a new customer', async () => {
        const newCustomerData = {
          contact_id: 'CUST002',
          customer_name: 'Jane Smith',
          email: 'jane.smith@example.com',
          phone: '+919876543211',
          outstanding_receivable_amount: 3000,
          cf_pgdca_course: 'PGDCA',
          cf_batch_name: 'Batch B'
        };

        const response = await request(app)
          .post('/api/customers')
          .send(newCustomerData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.customer.customer_name).toBe('Jane Smith');
        expect(response.body.customer.email).toBe('jane.smith@example.com');
      });

      it('should return error for duplicate contact_id', async () => {
        const duplicateCustomerData = {
          contact_id: 'CUST001', // Already exists
          customer_name: 'Duplicate Customer',
          email: 'duplicate@example.com'
        };

        const response = await request(app)
          .post('/api/customers')
          .send(duplicateCustomerData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('duplicate');
      });
    });

    describe('PUT /api/customers/:id', () => {
      it('should update customer', async () => {
        const updateData = {
          customer_name: 'John Updated',
          email: 'john.updated@example.com'
        };

        const response = await request(app)
          .put(`/api/customers/${testCustomer.contact_id}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.customer.customer_name).toBe('John Updated');
        expect(response.body.customer.email).toBe('john.updated@example.com');
      });

      it('should return 404 for non-existent customer', async () => {
        const response = await request(app)
          .put('/api/customers/NONEXISTENT')
          .send({ customer_name: 'Updated' })
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Customer not found');
      });
    });

    describe('DELETE /api/customers/:id', () => {
      it('should delete customer', async () => {
        const response = await request(app)
          .delete(`/api/customers/${testCustomer.contact_id}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('deleted');

        // Verify customer is deleted
        const deletedCustomer = await Customer.findOne({ contact_id: testCustomer.contact_id });
        expect(deletedCustomer).toBeNull();
      });

      it('should return 404 for non-existent customer', async () => {
        const response = await request(app)
          .delete('/api/customers/NONEXISTENT')
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Customer not found');
      });
    });
  });

  describe('Payment Routes', () => {
    describe('GET /api/payments', () => {
      it('should get all payments', async () => {
        const response = await request(app)
          .get('/api/payments')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.payments)).toBe(true);
        expect(response.body.payments.length).toBeGreaterThan(0);
        expect(response.body.payments[0].amount).toBe(2000);
      });

      it('should get payments with pagination', async () => {
        const response = await request(app)
          .get('/api/payments?page=1&limit=10')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.payments).toBeDefined();
        expect(response.body.pagination).toBeDefined();
      });

      it('should filter payments by customer', async () => {
        const response = await request(app)
          .get(`/api/payments?customer_id=${testCustomer.contact_id}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.payments.length).toBeGreaterThan(0);
        expect(response.body.payments[0].customer_id).toBe(testCustomer.contact_id);
      });

      it('should filter payments by date range', async () => {
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        const response = await request(app)
          .get(`/api/payments?start_date=${startDate}&end_date=${endDate}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.payments.length).toBeGreaterThan(0);
      });
    });

    describe('GET /api/payments/:id', () => {
      it('should get payment by ID', async () => {
        const response = await request(app)
          .get(`/api/payments/${testPayment._id}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.payment.amount).toBe(2000);
        expect(response.body.payment.customer_id).toBe('CUST001');
      });

      it('should return 404 for non-existent payment', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const response = await request(app)
          .get(`/api/payments/${fakeId}`)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Payment not found');
      });
    });

    describe('POST /api/payments', () => {
      it('should create a new payment', async () => {
        const newPaymentData = {
          customer_id: 'CUST001',
          amount: 1500,
          date: new Date(),
          payment_method: 'Bank Transfer',
          reference_number: 'REF002',
          description: 'Monthly fee payment'
        };

        const response = await request(app)
          .post('/api/payments')
          .send(newPaymentData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.payment.amount).toBe(1500);
        expect(response.body.payment.payment_method).toBe('Bank Transfer');
      });

      it('should return error for invalid payment data', async () => {
        const invalidPaymentData = {
          customer_id: 'CUST001',
          amount: -100, // Invalid amount
          date: new Date(),
          payment_method: 'Cash'
        };

        const response = await request(app)
          .post('/api/payments')
          .send(invalidPaymentData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      });
    });

    describe('PUT /api/payments/:id', () => {
      it('should update payment', async () => {
        const updateData = {
          amount: 2500,
          description: 'Updated payment description'
        };

        const response = await request(app)
          .put(`/api/payments/${testPayment._id}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.payment.amount).toBe(2500);
        expect(response.body.payment.description).toBe('Updated payment description');
      });

      it('should return 404 for non-existent payment', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const response = await request(app)
          .put(`/api/payments/${fakeId}`)
          .send({ amount: 3000 })
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Payment not found');
      });
    });

    describe('DELETE /api/payments/:id', () => {
      it('should delete payment', async () => {
        const response = await request(app)
          .delete(`/api/payments/${testPayment._id}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('deleted');

        // Verify payment is deleted
        const deletedPayment = await Payment.findById(testPayment._id);
        expect(deletedPayment).toBeNull();
      });

      it('should return 404 for non-existent payment', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const response = await request(app)
          .delete(`/api/payments/${fakeId}`)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Payment not found');
      });
    });
  });

  describe('Invoice Routes', () => {
    describe('GET /api/invoices', () => {
      it('should get all invoices', async () => {
        const response = await request(app)
          .get('/api/invoices')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.invoices)).toBe(true);
        expect(response.body.invoices.length).toBeGreaterThan(0);
        expect(response.body.invoices[0].amount).toBe(5000);
      });

      it('should get invoices with pagination', async () => {
        const response = await request(app)
          .get('/api/invoices?page=1&limit=10')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.invoices).toBeDefined();
        expect(response.body.pagination).toBeDefined();
      });

      it('should filter invoices by status', async () => {
        const response = await request(app)
          .get('/api/invoices?status=pending')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.invoices.length).toBeGreaterThan(0);
        expect(response.body.invoices[0].status).toBe('pending');
      });

      it('should filter invoices by customer', async () => {
        const response = await request(app)
          .get(`/api/invoices?customer_id=${testCustomer.contact_id}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.invoices.length).toBeGreaterThan(0);
        expect(response.body.invoices[0].customer_id).toBe(testCustomer.contact_id);
      });
    });

    describe('GET /api/invoices/:id', () => {
      it('should get invoice by ID', async () => {
        const response = await request(app)
          .get(`/api/invoices/${testInvoice._id}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.invoice.amount).toBe(5000);
        expect(response.body.invoice.customer_id).toBe('CUST001');
      });

      it('should return 404 for non-existent invoice', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const response = await request(app)
          .get(`/api/invoices/${fakeId}`)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Invoice not found');
      });
    });

    describe('POST /api/invoices', () => {
      it('should create a new invoice', async () => {
        const newInvoiceData = {
          invoice_id: 'INV002',
          customer_id: 'CUST001',
          amount: 3000,
          date: new Date(),
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'pending',
          description: 'Course fee for PGDCA'
        };

        const response = await request(app)
          .post('/api/invoices')
          .send(newInvoiceData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.invoice.amount).toBe(3000);
        expect(response.body.invoice.description).toBe('Course fee for PGDCA');
      });

      it('should return error for duplicate invoice_id', async () => {
        const duplicateInvoiceData = {
          invoice_id: 'INV001', // Already exists
          customer_id: 'CUST001',
          amount: 3000,
          date: new Date(),
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'pending'
        };

        const response = await request(app)
          .post('/api/invoices')
          .send(duplicateInvoiceData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('duplicate');
      });
    });

    describe('PUT /api/invoices/:id', () => {
      it('should update invoice', async () => {
        const updateData = {
          amount: 6000,
          status: 'paid',
          description: 'Updated invoice description'
        };

        const response = await request(app)
          .put(`/api/invoices/${testInvoice._id}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.invoice.amount).toBe(6000);
        expect(response.body.invoice.status).toBe('paid');
        expect(response.body.invoice.description).toBe('Updated invoice description');
      });

      it('should return 404 for non-existent invoice', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const response = await request(app)
          .put(`/api/invoices/${fakeId}`)
          .send({ amount: 7000 })
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Invoice not found');
      });
    });

    describe('DELETE /api/invoices/:id', () => {
      it('should delete invoice', async () => {
        const response = await request(app)
          .delete(`/api/invoices/${testInvoice._id}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('deleted');

        // Verify invoice is deleted
        const deletedInvoice = await Invoice.findById(testInvoice._id);
        expect(deletedInvoice).toBeNull();
      });

      it('should return 404 for non-existent invoice', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const response = await request(app)
          .delete(`/api/invoices/${fakeId}`)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Invoice not found');
      });
    });
  });

  describe('Notification Routes', () => {
    describe('GET /api/notifications', () => {
      it('should get all notifications', async () => {
        const response = await request(app)
          .get('/api/notifications')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.notifications)).toBe(true);
        expect(response.body.notifications.length).toBeGreaterThan(0);
        expect(response.body.notifications[0].title).toBe('Test Notification');
      });

      it('should get notifications with pagination', async () => {
        const response = await request(app)
          .get('/api/notifications?page=1&limit=10')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.notifications).toBeDefined();
        expect(response.body.pagination).toBeDefined();
      });

      it('should filter notifications by user', async () => {
        const response = await request(app)
          .get(`/api/notifications?user_id=${testNotification.user_id}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.notifications.length).toBeGreaterThan(0);
        expect(response.body.notifications[0].user_id).toBe(testNotification.user_id);
      });

      it('should filter notifications by read status', async () => {
        const response = await request(app)
          .get('/api/notifications?is_read=false')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.notifications.length).toBeGreaterThan(0);
        expect(response.body.notifications[0].is_read).toBe(false);
      });
    });

    describe('GET /api/notifications/:id', () => {
      it('should get notification by ID', async () => {
        const response = await request(app)
          .get(`/api/notifications/${testNotification._id}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.notification.title).toBe('Test Notification');
        expect(response.body.notification.message).toBe('This is a test notification');
      });

      it('should return 404 for non-existent notification', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const response = await request(app)
          .get(`/api/notifications/${fakeId}`)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Notification not found');
      });
    });

    describe('POST /api/notifications', () => {
      it('should create a new notification', async () => {
        const newNotificationData = {
          user_id: 'USER002',
          title: 'New Notification',
          message: 'This is a new notification',
          type: 'reminder',
          is_read: false
        };

        const response = await request(app)
          .post('/api/notifications')
          .send(newNotificationData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.notification.title).toBe('New Notification');
        expect(response.body.notification.type).toBe('reminder');
      });
    });

    describe('PUT /api/notifications/:id', () => {
      it('should update notification', async () => {
        const updateData = {
          is_read: true,
          title: 'Updated Notification'
        };

        const response = await request(app)
          .put(`/api/notifications/${testNotification._id}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.notification.is_read).toBe(true);
        expect(response.body.notification.title).toBe('Updated Notification');
      });

      it('should return 404 for non-existent notification', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const response = await request(app)
          .put(`/api/notifications/${fakeId}`)
          .send({ is_read: true })
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Notification not found');
      });
    });

    describe('DELETE /api/notifications/:id', () => {
      it('should delete notification', async () => {
        const response = await request(app)
          .delete(`/api/notifications/${testNotification._id}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('deleted');

        // Verify notification is deleted
        const deletedNotification = await Notification.findById(testNotification._id);
        expect(deletedNotification).toBeNull();
      });

      it('should return 404 for non-existent notification', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const response = await request(app)
          .delete(`/api/notifications/${fakeId}`)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Notification not found');
      });
    });
  });

  describe('Admin Auth Routes', () => {
    let testAdmin;
    beforeEach(async () => {
      await User.deleteMany({});
      testAdmin = await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        passwordHash: await require('bcryptjs').hash('adminpass', 10)
      });
      sendgridService.sendOtpEmail.mockClear();
    });

    it('should send OTP email on admin-reset-password-request', async () => {
      const response = await request(app)
        .post('/api/auth/admin-reset-password-request')
        .send({ email: 'admin@example.com' })
        .expect(200);
      expect(response.body.success).toBe(true);
      expect(sendgridService.sendOtpEmail).toHaveBeenCalledWith('admin@example.com', expect.any(String));
    });

    it('should verify OTP and return a token', async () => {
      // Simulate OTP request
      await request(app)
        .post('/api/auth/admin-reset-password-request')
        .send({ email: 'admin@example.com' });
      const admin = await User.findOne({ email: 'admin@example.com' });
      const otp = admin.otp;
      const response = await request(app)
        .post('/api/auth/admin-verify-otp')
        .send({ email: 'admin@example.com', otp })
        .expect(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
    });

    it('should reset password with valid token', async () => {
      // Simulate OTP request and verification
      await request(app)
        .post('/api/auth/admin-reset-password-request')
        .send({ email: 'admin@example.com' });
      let admin = await User.findOne({ email: 'admin@example.com' });
      const otp = admin.otp;
      const verifyRes = await request(app)
        .post('/api/auth/admin-verify-otp')
        .send({ email: 'admin@example.com', otp });
      const token = verifyRes.body.token;
      const response = await request(app)
        .post('/api/auth/admin-reset-password')
        .send({ token, newPassword: 'newadminpass' })
        .expect(200);
      expect(response.body.success).toBe(true);
      // Check password actually changed
      admin = await User.findOne({ email: 'admin@example.com' });
      const bcrypt = require('bcryptjs');
      const valid = await bcrypt.compare('newadminpass', admin.passwordHash);
      expect(valid).toBe(true);
    });
  });
}); 