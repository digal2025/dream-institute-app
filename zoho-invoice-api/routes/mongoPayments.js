const express = require('express');
const Payment = require('../backend/models/Payment');
const Invoice = require('../backend/models/Invoice');
const NotificationService = require('../services/notificationService');
const User = require('../backend/models/User');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');



const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to check if user has super_admin role
const requireSuperAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token. User not found.' });
    }

    if (user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. Super admin role required.' });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

// GET /api/mongo/payments - paginated, filtered, searchable, and by customer/month
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, customer_id, month, ...filters } = req.query;
    const query = {};
    // Search by customer_name, payment_number, reference_number
    if (search) {
      query.$or = [
        { customer_name: { $regex: search, $options: 'i' } },
        { payment_number: { $regex: search, $options: 'i' } },
        { reference_number: { $regex: search, $options: 'i' } }
      ];
    }
    if (customer_id) {
      query.customer_id = customer_id;
    }
    if (month) {
      // Filter payments by month (YYYY-MM)
      const [year, m] = month.split('-');
      const from = new Date(Number(year), Number(m) - 1, 1);
      const to = new Date(Number(year), Number(m), 0, 23, 59, 59, 999);
      query.date = { $gte: from, $lte: to };
    }
    // Add any other filters
    Object.keys(filters).forEach(key => {
      query[key] = filters[key];
    });
    const total = await Payment.countDocuments(query);
    const customerpayments = await Payment.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ customerpayments, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new payment
router.post('/', async (req, res) => {
  try {
    if (!req.body.payment_id) {
      req.body.payment_id = uuidv4();
    }
    
    const payment = await Payment.create(req.body);
    
    // Fetch customer name if not provided
    let customerName = payment.customer_name;
    if (!customerName && payment.customer_id) {
      const Customer = require('../backend/models/Customer');
      const customer = await Customer.findOne({ contact_id: payment.customer_id });
      if (customer) {
        customerName = customer.customer_name;
        // Update the payment with customer name
        await Payment.findByIdAndUpdate(payment._id, { customer_name: customerName });
        payment.customer_name = customerName;
      }
    }
    
    // Update invoice balance if payment is for a specific customer
    let invoiceUpdateDetails = null;
    if (payment.customer_id && payment.amount) {
      const invoices = await Invoice.find({ customer_id: payment.customer_id });
      
      for (const invoice of invoices) {
        // Update invoice balance
        const oldBalance = invoice.balance;
        const newBalance = Math.max(0, invoice.balance - payment.amount);
        const paymentMade = invoice.total - newBalance;
        
        await Invoice.findByIdAndUpdate(invoice._id, {
          balance: newBalance,
          payment_made: paymentMade,
          last_modified_time: new Date(),
          $push: {
            payments: {
              payment_id: payment.payment_id,
              amount: payment.amount,
              date: payment.date,
              payment_mode: payment.payment_mode
            }
          }
        });
        
        invoiceUpdateDetails = {
          oldBalance,
          newBalance,
          totalPaid: paymentMade,
          invoiceTotal: invoice.total
        };
      }
    }
    
    // Send detailed notification with professional formatting
    const currentTime = new Date().toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    const userName = req.body.user || (req.user && req.user.name) || 'System';
    
    let notificationMessage = `💰 Payment Added | ${currentTime}\n`;
    notificationMessage += `👤 Student: ${payment.customer_name}\n`;
    notificationMessage += `💳 Amount: ₹${payment.amount.toLocaleString()}\n`;
    notificationMessage += `🏦 Payment Mode: ${payment.payment_mode || 'Not specified'}\n`;
    if (payment.reference_number) {
      notificationMessage += `📝 Reference: ${payment.reference_number}\n`;
    }
    if (invoiceUpdateDetails) {
      notificationMessage += `📊 Outstanding Balance: ₹${invoiceUpdateDetails.oldBalance.toLocaleString()} → ₹${invoiceUpdateDetails.newBalance.toLocaleString()}\n`;
      notificationMessage += `💵 Total Paid: ₹${invoiceUpdateDetails.totalPaid.toLocaleString()}\n`;
    }
    notificationMessage += `👨‍💼 Updated by: ${userName}`;
    
    // Create minimal notification
    await NotificationService.createNotification({
      type: 'payment_add',
      entityId: payment.payment_id,
      entityName: payment.customer_name,
      user: userName,
      message: `💰 ₹${payment.amount.toLocaleString()} payment added for ${payment.customer_name}`,
      details: {
        amount: payment.amount,
        paymentMode: payment.payment_mode,
        customerId: payment.customer_id
      }
    });
    
    res.json({ payment });
  } catch (err) {
    console.error('Error adding payment:', err.stack || err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// DELETE /api/mongo/payments/:id - Delete a payment by id (Super Admin only)
router.delete('/:id', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Payment.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    // Send detailed notification with professional formatting
    const currentTime = new Date().toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    // Get customer name if not available
    let customerName = deleted.customer_name;
    if (!customerName && deleted.customer_id) {
      const Customer = require('../backend/models/Customer');
      const customer = await Customer.findOne({ contact_id: deleted.customer_id });
      if (customer) {
        customerName = customer.customer_name;
      }
    }
    customerName = customerName || 'Unknown Student';
    
    let notificationMessage = `🗑️ Payment Deleted | ${currentTime}\n`;
    notificationMessage += `👤 Student: ${customerName}\n`;
    notificationMessage += `💳 Amount: ₹${deleted.amount.toLocaleString()}\n`;
    notificationMessage += `🏦 Payment Mode: ${deleted.payment_mode || 'Not specified'}\n`;
    if (deleted.reference_number) {
      notificationMessage += `📝 Reference: ${deleted.reference_number}\n`;
    }
    notificationMessage += `⚠️ Deleted by Super Admin: ${req.user.name}`;
    
    // Create minimal notification
    await NotificationService.createNotification({
      type: 'payment_delete',
      entityId: deleted.payment_id,
      entityName: customerName,
      user: req.user.name,
      message: `🗑️ ₹${deleted.amount.toLocaleString()} payment deleted for ${customerName}`,
      details: {
        amount: deleted.amount,
        customerId: deleted.customer_id
      }
    });
    
    res.json({ success: true, message: 'Payment deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete payment', details: err.message });
  }
});

// PATCH /api/mongo/payments/:id - Update payment fields
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, amount, payment_mode, reference_number } = req.body;
    
    // Get the original payment for comparison
    const originalPayment = await Payment.findById(id);
    if (!originalPayment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    const update = {};
    if (date !== undefined) update.date = date;
    if (amount !== undefined) update.amount = amount;
    if (payment_mode !== undefined) update.payment_mode = payment_mode;
    if (reference_number !== undefined) update.reference_number = reference_number;
    
    const updated = await Payment.findByIdAndUpdate(id, update, { new: true });
    if (!updated) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    // Send detailed notification for specific field changes
    let changes = [];
    
    if (amount !== undefined && amount !== originalPayment.amount) {
      changes.push(`Amount: ₹${originalPayment.amount.toLocaleString()} → ₹${amount.toLocaleString()}`);
    }
    
    if (payment_mode !== undefined && payment_mode !== originalPayment.payment_mode) {
      changes.push(`Payment Mode: ${originalPayment.payment_mode || 'None'} → ${payment_mode}`);
    }
    
    if (reference_number !== undefined && reference_number !== originalPayment.reference_number) {
      const oldRef = originalPayment.reference_number || 'None';
      const newRef = reference_number || 'None';
      changes.push(`Reference: "${oldRef}" → "${newRef}"`);
    }
    
    if (date !== undefined && new Date(date).getTime() !== new Date(originalPayment.date).getTime()) {
      const oldDate = new Date(originalPayment.date).toLocaleDateString();
      const newDate = new Date(date).toLocaleDateString();
      changes.push(`Date: ${oldDate} → ${newDate}`);
    }
    
    if (changes.length > 0) {
      const currentTime = new Date().toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      
      // Get user name from request - try multiple sources
      const userName = req.body.user || req.user?.name || req.headers['x-user-name'] || 'System';
      
          // Get student name from original payment (more reliable)
    let studentName = originalPayment.customer_name || updated.customer_name;
    if (!studentName && originalPayment.customer_id) {
      const Customer = require('../backend/models/Customer');
      const customer = await Customer.findOne({ contact_id: originalPayment.customer_id });
      if (customer) {
        studentName = customer.customer_name;
      }
    }
    studentName = studentName || 'Unknown Student';
      
      let notificationMessage = `🔄 Payment Updated | ${currentTime}\n`;
      notificationMessage += `👤 Student: ${studentName}\n`;
      notificationMessage += `📝 Changes Made:\n`;
      
      changes.forEach((change, index) => {
        notificationMessage += `   ${index + 1}. ${change}\n`;
      });
      
      notificationMessage += `👨‍💼 Updated by: ${userName}`;
      
      // Create minimal notification
      const changeSummary = changes.slice(0, 2).join(', ');
      await NotificationService.createNotification({
        type: 'payment_update',
        entityId: updated.payment_id,
        entityName: studentName,
        user: userName,
        message: `✏️ Payment updated for ${studentName}`,
        details: {
          changes: changes.slice(0, 3), // Only store first 3 changes
          customerId: updated.customer_id
        }
      });
    }
    
    res.json({ success: true, payment: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update payment', details: err.message });
  }
});

module.exports = router;