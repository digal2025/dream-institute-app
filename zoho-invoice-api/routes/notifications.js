const express = require('express');
const Notification = require('../backend/models/Notification');
const router = express.Router();

// GET /api/notifications - List all notifications (most recent first)
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ time: -1 });
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notifications - Add a new notification
router.post('/', async (req, res) => {
  try {
    const { message, time, read, type, user } = req.body;
    const notification = await Notification.create({ message, time, read, type, user });
    res.json({ notification });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/notifications/:id - Mark as read
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndUpdate(id, { read: true }, { new: true });
    res.json({ notification });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/notifications - Delete all notifications
router.delete('/', async (req, res) => {
  try {
    await Notification.deleteMany({});
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 