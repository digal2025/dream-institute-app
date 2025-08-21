const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  message: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    required: true,
    enum: ['student_add', 'student_update', 'student_delete', 'payment_add', 'payment_update', 'payment_delete', 'invoice_create', 'invoice_update']
  },
  entityId: { 
    type: String, 
    required: true 
  },
  entityName: { 
    type: String, 
    required: true 
  },
  user: { 
    type: String, 
    required: true 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
  read: { 
    type: Boolean, 
    default: false 
  },
  details: { 
    type: mongoose.Schema.Types.Mixed, 
    default: {} 
  }
});

// Index for efficient querying
NotificationSchema.index({ timestamp: -1 });
NotificationSchema.index({ type: 1, entityId: 1 });
NotificationSchema.index({ read: 1 });
NotificationSchema.index({ user: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);
