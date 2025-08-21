const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, required: true, default: 'admin', enum: ['admin', 'super_admin', 'manager', 'operator'] },
  createdAt: { type: Date, default: Date.now },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  otp: { type: String },
  otpExpires: { type: Date }
});

module.exports = mongoose.model('User', UserSchema); 