const express = require('express');
const Payment = require('../backend/models/Payment');
const Invoice = require('../backend/models/Invoice');
const User = require('../backend/models/User');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

// Helper to send notification
const sendNotification = async (message, user) => {
  try {
    const Notification = require('../backend/models/Notification');
    await Notification.create({
      message,
      time: new Date(),
      read: false,
      type: 'payment',
      user: user || 'System'
    });
  } catch (err) {
    console.error('Error sending notification:', err);
  }
};

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
    
    // Send detailed notification
    let notificationMessage = `Payment added: ₹${payment.amount.toLocaleString()} for ${payment.customer_name}`;
    if (payment.payment_mode) {
      notificationMessage += ` (${payment.payment_mode})`;
    }
    if (invoiceUpdateDetails) {
      notificationMessage += ` - Outstanding: ₹${invoiceUpdateDetails.oldBalance.toLocaleString()} → ₹${invoiceUpdateDetails.newBalance.toLocaleString()}`;
      notificationMessage += ` (Total Paid: ₹${invoiceUpdateDetails.totalPaid.toLocaleString()})`;
    }
    
    await sendNotification(notificationMessage, req.body.user || (req.user && req.user.name));
    
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
    
    // Send detailed notification
    let notificationMessage = `Payment deleted: ₹${deleted.amount.toLocaleString()} for ${deleted.customer_name}`;
    if (deleted.payment_mode) {
      notificationMessage += ` (${deleted.payment_mode})`;
    }
    notificationMessage += ` - Deleted by Super Admin`;
    
    await sendNotification(notificationMessage, req.user.name);
    
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
    
    // Send detailed notification for significant changes
    let notificationMessage = `Payment updated for ${updated.customer_name}`;
    let hasChanges = false;
    
    if (amount !== undefined && amount !== originalPayment.amount) {
      notificationMessage += ` - Amount: ₹${originalPayment.amount.toLocaleString()} → ₹${amount.toLocaleString()}`;
      hasChanges = true;
    }
    
    if (payment_mode !== undefined && payment_mode !== originalPayment.payment_mode) {
      notificationMessage += ` - Mode: ${originalPayment.payment_mode} → ${payment_mode}`;
      hasChanges = true;
    }
    
    if (date !== undefined && new Date(date).getTime() !== new Date(originalPayment.date).getTime()) {
      notificationMessage += ` - Date updated`;
      hasChanges = true;
    }
    
    if (hasChanges) {
      await sendNotification(notificationMessage, req.body.user || 'System');
    }
    
    res.json({ success: true, payment: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update payment', details: err.message });
  }
});

module.exports = router;