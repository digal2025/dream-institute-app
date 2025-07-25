const mongoose = require('mongoose');
const Customer = require('../../backend/models/Customer');
const Payment = require('../../backend/models/Payment');
const Invoice = require('../../backend/models/Invoice');
const User = require('../../backend/models/User');
const Token = require('../../backend/models/Token');
const Notification = require('../../backend/models/Notification');
const SyncLog = require('../../backend/models/SyncLog');

describe('Backend Models', () => {
  describe('Customer Model', () => {
    it('should create a customer with required fields', async () => {
      const customerData = {
        contact_id: 'CUST001',
        customer_name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+919876543210',
        outstanding_receivable_amount: 5000,
        cf_pgdca_course: 'PGDCA',
        cf_batch_name: 'Batch A'
      };

      const customer = new Customer(customerData);
      const savedCustomer = await customer.save();

      expect(savedCustomer.contact_id).toBe('CUST001');
      expect(savedCustomer.customer_name).toBe('John Doe');
      expect(savedCustomer.email).toBe('john.doe@example.com');
      expect(savedCustomer.phone).toBe('+919876543210');
      expect(savedCustomer.outstanding_receivable_amount).toBe(5000);
      expect(savedCustomer.cf_pgdca_course).toBe('PGDCA');
      expect(savedCustomer.cf_batch_name).toBe('Batch A');
    });

    it('should create a customer with minimal required fields', async () => {
      const customerData = {
        contact_id: 'CUST002',
        customer_name: 'Jane Smith'
      };

      const customer = new Customer(customerData);
      const savedCustomer = await customer.save();

      expect(savedCustomer.contact_id).toBe('CUST002');
      expect(savedCustomer.customer_name).toBe('Jane Smith');
      expect(savedCustomer.email).toBeUndefined();
    });

    it('should handle customer with all optional fields', async () => {
      const customerData = {
        contact_id: 'CUST003',
        customer_name: 'Bob Wilson',
        email: 'bob.wilson@example.com',
        phone: '+919876543211',
        outstanding_receivable_amount: 3000,
        cf_pgdca_course: 'PGDCA',
        cf_batch_name: 'Batch B',
        address: '123 Main St, City',
        gst_number: 'GST123456789',
        company_name: 'Wilson Corp'
      };

      const customer = new Customer(customerData);
      const savedCustomer = await customer.save();

      expect(savedCustomer.address).toBe('123 Main St, City');
      expect(savedCustomer.gst_number).toBe('GST123456789');
      expect(savedCustomer.company_name).toBe('Wilson Corp');
    });
  });

  describe('Payment Model', () => {
    it('should create a payment with required fields', async () => {
      const paymentData = {
        customer_id: 'CUST001',
        amount: 2000,
        date: new Date(),
        payment_method: 'Cash',
        reference_number: 'REF001'
      };

      const payment = new Payment(paymentData);
      const savedPayment = await payment.save();

      expect(savedPayment.customer_id).toBe('CUST001');
      expect(savedPayment.amount).toBe(2000);
      expect(savedPayment.payment_method).toBe('Cash');
      expect(savedPayment.reference_number).toBe('REF001');
      expect(savedPayment.date).toBeInstanceOf(Date);
    });

    it('should create a payment with all fields', async () => {
      const paymentData = {
        customer_id: 'CUST002',
        amount: 1500,
        date: new Date(),
        payment_method: 'Bank Transfer',
        reference_number: 'REF002',
        description: 'Monthly fee payment',
        status: 'completed',
        transaction_id: 'TXN123456'
      };

      const payment = new Payment(paymentData);
      const savedPayment = await payment.save();

      expect(savedPayment.description).toBe('Monthly fee payment');
      expect(savedPayment.status).toBe('completed');
      expect(savedPayment.transaction_id).toBe('TXN123456');
    });

    it('should handle payment with decimal amount', async () => {
      const paymentData = {
        customer_id: 'CUST003',
        amount: 1999.99,
        date: new Date(),
        payment_method: 'Credit Card'
      };

      const payment = new Payment(paymentData);
      const savedPayment = await payment.save();

      expect(savedPayment.amount).toBe(1999.99);
    });
  });

  describe('Invoice Model', () => {
    it('should create an invoice with required fields', async () => {
      const invoiceData = {
        invoice_id: 'INV001',
        customer_id: 'CUST001',
        amount: 5000,
        date: new Date(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: 'pending'
      };

      const invoice = new Invoice(invoiceData);
      const savedInvoice = await invoice.save();

      expect(savedInvoice.invoice_id).toBe('INV001');
      expect(savedInvoice.customer_id).toBe('CUST001');
      expect(savedInvoice.amount).toBe(5000);
      expect(savedInvoice.status).toBe('pending');
    });

    it('should create an invoice with all fields', async () => {
      const invoiceData = {
        invoice_id: 'INV002',
        customer_id: 'CUST002',
        amount: 3000,
        date: new Date(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'paid',
        description: 'Course fee for PGDCA',
        tax_amount: 300,
        total_amount: 3300
      };

      const invoice = new Invoice(invoiceData);
      const savedInvoice = await invoice.save();

      expect(savedInvoice.description).toBe('Course fee for PGDCA');
      expect(savedInvoice.tax_amount).toBe(300);
      expect(savedInvoice.total_amount).toBe(3300);
    });
  });

  describe('User Model', () => {
    it('should create a user with required fields', async () => {
      const userData = {
        username: 'admin',
        email: 'admin@example.com',
        password: 'hashedPassword123',
        role: 'admin'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.username).toBe('admin');
      expect(savedUser.email).toBe('admin@example.com');
      expect(savedUser.password).toBe('hashedPassword123');
      expect(savedUser.role).toBe('admin');
    });

    it('should create a user with all fields', async () => {
      const userData = {
        username: 'teacher',
        email: 'teacher@example.com',
        password: 'hashedPassword456',
        role: 'teacher',
        first_name: 'John',
        last_name: 'Teacher',
        phone: '+919876543210',
        is_active: true
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.first_name).toBe('John');
      expect(savedUser.last_name).toBe('Teacher');
      expect(savedUser.phone).toBe('+919876543210');
      expect(savedUser.is_active).toBe(true);
    });
  });

  describe('Token Model', () => {
    it('should create a token with required fields', async () => {
      const tokenData = {
        user_id: 'USER001',
        token: 'jwt_token_here',
        type: 'access',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
      };

      const token = new Token(tokenData);
      const savedToken = await token.save();

      expect(savedToken.user_id).toBe('USER001');
      expect(savedToken.token).toBe('jwt_token_here');
      expect(savedToken.type).toBe('access');
      expect(savedToken.expires_at).toBeInstanceOf(Date);
    });

    it('should create a token with all fields', async () => {
      const tokenData = {
        user_id: 'USER002',
        token: 'refresh_token_here',
        type: 'refresh',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        is_revoked: false,
        created_at: new Date()
      };

      const token = new Token(tokenData);
      const savedToken = await token.save();

      expect(savedToken.is_revoked).toBe(false);
      expect(savedToken.created_at).toBeInstanceOf(Date);
    });
  });

  describe('Notification Model', () => {
    it('should create a notification with required fields', async () => {
      const notificationData = {
        user_id: 'USER001',
        title: 'Payment Reminder',
        message: 'Your payment is due',
        type: 'reminder',
        is_read: false
      };

      const notification = new Notification(notificationData);
      const savedNotification = await notification.save();

      expect(savedNotification.user_id).toBe('USER001');
      expect(savedNotification.title).toBe('Payment Reminder');
      expect(savedNotification.message).toBe('Your payment is due');
      expect(savedNotification.type).toBe('reminder');
      expect(savedNotification.is_read).toBe(false);
    });

    it('should create a notification with all fields', async () => {
      const notificationData = {
        user_id: 'USER002',
        title: 'Payment Received',
        message: 'Your payment of ₹2000 has been received',
        type: 'payment',
        is_read: true,
        created_at: new Date(),
        read_at: new Date()
      };

      const notification = new Notification(notificationData);
      const savedNotification = await notification.save();

      expect(savedNotification.is_read).toBe(true);
      expect(savedNotification.created_at).toBeInstanceOf(Date);
      expect(savedNotification.read_at).toBeInstanceOf(Date);
    });
  });

  describe('SyncLog Model', () => {
    it('should create a sync log with required fields', async () => {
      const syncLogData = {
        sync_type: 'zoho_to_mongo',
        status: 'completed',
        records_processed: 100,
        records_synced: 95,
        errors: 5
      };

      const syncLog = new SyncLog(syncLogData);
      const savedSyncLog = await syncLog.save();

      expect(savedSyncLog.sync_type).toBe('zoho_to_mongo');
      expect(savedSyncLog.status).toBe('completed');
      expect(savedSyncLog.records_processed).toBe(100);
      expect(savedSyncLog.records_synced).toBe(95);
      expect(savedSyncLog.errors).toBe(5);
    });

    it('should create a sync log with all fields', async () => {
      const syncLogData = {
        sync_type: 'mongo_to_zoho',
        status: 'failed',
        records_processed: 50,
        records_synced: 45,
        errors: 5,
        error_details: 'API rate limit exceeded',
        started_at: new Date(),
        completed_at: new Date(),
        duration_ms: 5000
      };

      const syncLog = new SyncLog(syncLogData);
      const savedSyncLog = await syncLog.save();

      expect(savedSyncLog.error_details).toBe('API rate limit exceeded');
      expect(savedSyncLog.started_at).toBeInstanceOf(Date);
      expect(savedSyncLog.completed_at).toBeInstanceOf(Date);
      expect(savedSyncLog.duration_ms).toBe(5000);
    });
  });

  describe('Model Relationships', () => {
    it('should handle customer-payment relationship', async () => {
      // Create a customer
      const customer = new Customer({
        contact_id: 'CUST_REL001',
        customer_name: 'Relationship Test Customer'
      });
      const savedCustomer = await customer.save();

      // Create payments for this customer
      const payment1 = new Payment({
        customer_id: savedCustomer.contact_id,
        amount: 1000,
        date: new Date(),
        payment_method: 'Cash'
      });
      const payment2 = new Payment({
        customer_id: savedCustomer.contact_id,
        amount: 2000,
        date: new Date(),
        payment_method: 'Bank Transfer'
      });

      await payment1.save();
      await payment2.save();

      // Verify payments exist for this customer
      const customerPayments = await Payment.find({ customer_id: savedCustomer.contact_id });
      expect(customerPayments).toHaveLength(2);
      expect(customerPayments[0].amount).toBe(1000);
      expect(customerPayments[1].amount).toBe(2000);
    });

    it('should handle user-notification relationship', async () => {
      // Create a user
      const user = new User({
        username: 'notification_test_user',
        email: 'notification@example.com',
        password: 'hashedPassword',
        role: 'student'
      });
      const savedUser = await user.save();

      // Create notifications for this user
      const notification1 = new Notification({
        user_id: savedUser._id.toString(),
        title: 'Test Notification 1',
        message: 'This is a test notification',
        type: 'info'
      });
      const notification2 = new Notification({
        user_id: savedUser._id.toString(),
        title: 'Test Notification 2',
        message: 'This is another test notification',
        type: 'warning'
      });

      await notification1.save();
      await notification2.save();

      // Verify notifications exist for this user
      const userNotifications = await Notification.find({ user_id: savedUser._id.toString() });
      expect(userNotifications).toHaveLength(2);
      expect(userNotifications[0].title).toBe('Test Notification 1');
      expect(userNotifications[1].title).toBe('Test Notification 2');
    });
  });

  describe('Model Validation', () => {
    it('should validate customer email format', async () => {
      const customerData = {
        contact_id: 'CUST_VAL001',
        customer_name: 'Validation Test',
        email: 'invalid-email'
      };

      const customer = new Customer(customerData);
      let error;
      
      try {
        await customer.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
    });

    it('should validate payment amount is positive', async () => {
      const paymentData = {
        customer_id: 'CUST001',
        amount: -100,
        date: new Date(),
        payment_method: 'Cash'
      };

      const payment = new Payment(paymentData);
      let error;
      
      try {
        await payment.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
    });

    it('should validate invoice due date is after invoice date', async () => {
      const invoiceData = {
        invoice_id: 'INV_VAL001',
        customer_id: 'CUST001',
        amount: 1000,
        date: new Date(),
        due_date: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        status: 'pending'
      };

      const invoice = new Invoice(invoiceData);
      let error;
      
      try {
        await invoice.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
    });
  });
}); 