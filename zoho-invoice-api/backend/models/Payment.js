const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  payment_id: { type: String, unique: true, index: true },
  payment_number: String,
  invoice_numbers: String,
  date: { type: Date, index: true },
  payment_mode: String,
  payment_mode_formatted: String,
  amount: Number,
  bcy_amount: Number,
  unused_amount: Number,
  bcy_unused_amount: Number,
  description: String,
  product_description: String,
  reference_number: String,
  customer_id: { type: String, index: true },
  customer_name: String,
  created_time: Date,
  last_modified_time: Date,
  payment_type: String,
  payment_status: String,
  settlement_status: String,
  applied_invoices: [mongoose.Schema.Types.Mixed],
  has_attachment: Boolean,
  documents: String,
  custom_fields_list: mongoose.Schema.Types.Mixed,
  tax_amount_withheld: Number
});

module.exports = mongoose.model('Payment', PaymentSchema); 