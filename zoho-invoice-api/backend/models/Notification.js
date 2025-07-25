const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  message: { type: String, required: true },
  time: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
  type: { type: String }, // e.g., 'add', 'update', 'delete', 'info'
  user: { type: String }, // username of the user who made the change
});

module.exports = mongoose.model('Notification', NotificationSchema); 