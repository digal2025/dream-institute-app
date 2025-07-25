const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  invoice_id: { type: String, unique: true, index: true },
  invoice_number: String,
  date: Date,
  due_date: Date,
  status: String,
  total: Number,
  balance: Number,
  customer_id: { type: String, index: true },
  customer_name: String,
  line_items: [mongoose.Schema.Types.Mixed],
  payment_made: Number,
  payments: [mongoose.Schema.Types.Mixed],
  created_time: Date,
  last_modified_time: Date,
  custom_fields: [mongoose.Schema.Types.Mixed]
});

module.exports = mongoose.model('Invoice', InvoiceSchema); 