const express = require('express');
const Payment = require('../backend/models/Payment');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

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
    res.json({ payment });
  } catch (err) {
    console.error('Error adding payment:', err.stack || err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// DELETE /api/mongo/payments/:id - Delete a payment by id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Payment.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Payment not found' });
    }
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
    const update = {};
    if (date !== undefined) update.date = date;
    if (amount !== undefined) update.amount = amount;
    if (payment_mode !== undefined) update.payment_mode = payment_mode;
    if (reference_number !== undefined) update.reference_number = reference_number;
    const updated = await Payment.findByIdAndUpdate(id, update, { new: true });
    if (!updated) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.json({ success: true, payment: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update payment', details: err.message });
  }
});

module.exports = router;