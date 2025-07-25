const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  customer_name: { type: String, required: false, index: true },
  email: { type: String, required: false, index: true },
  phone: { type: String, required: false, index: true },
  cf_pgdca_course: { type: String, required: false },
  cf_batch_name: { type: String, required: false },
  custom_fields: { type: Array, default: [] },
  contact_id: {
    type: String,
    unique: true,
    default: function () { return this._id.toString(); }
  },
  password: { type: String }, // hashed password
  otp: { type: String }, // last OTP sent
  otpExpires: { type: Date }, // OTP expiry
  mustChangePassword: { type: Boolean, default: false },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Customer', CustomerSchema); 