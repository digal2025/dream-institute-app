const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  accessToken: { type: String },
  refreshToken: { type: String },
  tokenExpiry: { type: Date }, // store expiry as a Date
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

tokenSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Token', tokenSchema); 