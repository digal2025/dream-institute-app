const express = require('express');
const Invoice = require('../backend/models/Invoice');
const router = express.Router();

// GET /api/mongo/invoices - paginated, filtered, searchable, and by customer/month
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, customer_id, month, ...filters } = req.query;
    const query = {};
    // Search by customer_name, invoice_number, status
    if (search) {
      query.$or = [
        { customer_name: { $regex: search, $options: 'i' } },
        { invoice_number: { $regex: search, $options: 'i' } },
        { status: { $regex: search, $options: 'i' } }
      ];
    }
    if (customer_id) {
      query.customer_id = customer_id;
    }
    if (month) {
      // Filter invoices by month (YYYY-MM)
      const [year, m] = month.split('-');
      const from = new Date(Number(year), Number(m) - 1, 1);
      const to = new Date(Number(year), Number(m), 0, 23, 59, 59, 999);
      query.date = { $gte: from, $lte: to };
    }
    // Add any other filters
    Object.keys(filters).forEach(key => {
      query[key] = filters[key];
    });
    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ invoices, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/mongo/invoices/customer/:customer_id - paginated, filtered, and by month
router.get('/customer/:customer_id', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, month, ...filters } = req.query;
    const query = { customer_id: req.params.customer_id };
    if (search) {
      query.$or = [
        { invoice_number: { $regex: search, $options: 'i' } },
        { status: { $regex: search, $options: 'i' } }
      ];
    }
    if (month) {
      const [year, m] = month.split('-');
      const from = new Date(Number(year), Number(m) - 1, 1);
      const to = new Date(Number(year), Number(m), 0, 23, 59, 59, 999);
      query.date = { $gte: from, $lte: to };
    }
    Object.keys(filters).forEach(key => {
      query[key] = filters[key];
    });
    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ invoices, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 