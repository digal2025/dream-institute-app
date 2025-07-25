const express = require('express');
const Customer = require('../backend/models/Customer');
const router = express.Router();
const mongoose = require('mongoose');
const Payment = require('../backend/models/Payment');

// GET /api/mongo/customers/:id - get a single customer by contact_id
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findOne({ contact_id: req.params.id });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json({ customer });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// GET /api/mongo/customers - paginated, filtered, searchable
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, ...filters } = req.query;
    const query = {};
    // Search by name, email, or phone
    if (search) {
      query.$or = [
        { customer_name: { $regex: search, $options: 'i' } },
        { contact_name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }
    // Add any other filters
    Object.keys(filters).forEach(key => {
      query[key] = filters[key];
    });
    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ customers, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('Error fetching customers:', err.stack || err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// Check for duplicate customer
router.post('/check-duplicates', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    let query = { $or: [] };

    // Build a case-insensitive and whitespace-trimmed query
    if (name && name.trim()) {
      query.$or.push({ customer_name: { $regex: `^${name.trim()}$`, $options: 'i' } });
    }
    if (email && email.trim()) {
      query.$or.push({ email: { $regex: `^${email.trim()}$`, $options: 'i' } });
    }
    if (phone && phone.trim()) {
      query.$or.push({ phone: phone.trim() });
    }

    // If no fields are provided or all are empty, it's not a valid request
    if (query.$or.length === 0) {
      return res.status(200).json({ exists: false });
    }

    const existingCustomer = await Customer.findOne(query);

    if (existingCustomer) {
      let field = 'field';
      if (name && existingCustomer.customer_name.toLowerCase() === name.trim().toLowerCase()) field = 'name';
      else if (email && existingCustomer.email.toLowerCase() === email.trim().toLowerCase()) field = 'email';
      else if (phone && existingCustomer.phone === phone.trim()) field = 'phone';
      
      return res.status(200).json({ exists: true, message: `A student with this ${field} already exists.` });
    }

    res.status(200).json({ exists: false });
  } catch (err) {
    res.status(500).json({ error: 'Server error while checking for duplicates.' });
  }
});


// Helper to send notification
const sendNotification = async (message, user) => {
  try {
    const Notification = require('../backend/models/Notification');
    await Notification.create({
      message,
      user,
      time: new Date(),
      read: false,
      type: 'student',
    });
  } catch (err) { /* ignore */ }
};

// Add new customer
router.post('/', async (req, res) => {
  try {
    let data = { ...req.body };
    if (!data.contact_id) delete data.contact_id;
    const created = await Customer.create(data);
    if (!created.contact_id) {
      created.contact_id = created._id.toString();
      await created.save();
    }
    // Send notification
    await sendNotification(`Added student: ${created.customer_name}`, req.body.user || (req.user && req.user.name));
    res.json({ customer: created });
  } catch (err) {
    console.error('Error adding customer:', err.stack || err);
    // Handle duplicate key error with a user-friendly message
    if (err.code === 11000) {
      res.status(400).json({ error: 'A customer with this contact_id already exists.' });
    } else {
      res.status(500).json({ error: err.message || 'Internal server error' });
    }
  }
});

// PATCH /api/mongo/customers/:id - update a single customer by contact_id
router.patch('/:id', async (req, res) => {
  try {
    const updated = await Customer.findOneAndUpdate(
      { contact_id: req.params.id },
      req.body,
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    // Send notification
    await sendNotification(`Updated student: ${updated.customer_name}`, req.body.user || (req.user && req.user.name));
    res.json({ customer: updated });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// DELETE /api/mongo/customers/:id - delete a single customer by contact_id
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Customer.findOneAndDelete({ contact_id: req.params.id });
    if (!deleted) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    // Send notification
    await sendNotification(`Deleted student: ${deleted.customer_name}`, req.body.user || (req.user && req.user.name));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// Catch-all for unexpected errors in this router
router.use((err, req, res, next) => {
  console.error('Unexpected error in mongoCustomers router:', err.stack || err);
  res.status(500).json({ error: 'Unexpected server error.' });
});

module.exports = router; 