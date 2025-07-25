const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendOtpEmail } = require('../../services/sendgridService');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'changeme-secret';

/**
 * POST /api/auth/register
 * Register a new user
 * Body: { name, email, password }
 */
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already registered' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });
    res.json({ success: true, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /api/auth/login
 * Login user
 * Body: { email, password }
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'All fields required' });
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(400).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /api/auth/admin-reset-password-request
 * Request admin password reset (send OTP to email)
 * Body: { email }
 */
router.post('/admin-reset-password-request', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  const user = await User.findOne({ email });
  // Always respond with success to prevent email enumeration
  if (!user) return res.json({ success: true, msg: 'If your email is registered, you will receive an OTP.' });
  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 min
  user.otp = otp;
  user.otpExpires = otpExpires;
  await user.save();
  try {
    await sendOtpEmail(email, otp);
    res.json({ success: true, msg: 'If your email is registered, you will receive an OTP.' });
  } catch (err) {
    console.error('SendGrid OTP email error (admin-reset-password-request):', err && err.stack ? err.stack : err);
    res.status(500).json({ error: 'Failed to send OTP email.' });
  }
});

/**
 * POST /api/auth/admin-verify-otp
 * Verify admin OTP
 * Body: { email, otp }
 */
router.post('/admin-verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });
  const user = await User.findOne({ email });
  if (!user || !user.otp || !user.otpExpires) return res.status(400).json({ error: 'Invalid or expired OTP' });
  if (user.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });
  if (user.otpExpires < new Date()) return res.status(400).json({ error: 'OTP expired' });
  // OTP is valid, clear it and set a reset token
  user.otp = undefined;
  user.otpExpires = undefined;
  const token = crypto.randomBytes(32).toString('hex');
  const tokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 min
  user.resetPasswordToken = token;
  user.resetPasswordExpires = tokenExpires;
  await user.save();
  res.json({ success: true, token });
});

/**
 * POST /api/auth/admin-reset-password
 * Reset admin password using token
 * Body: { token, newPassword }
 */
router.post('/admin-reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password are required' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: new Date() } });
  if (!user) return res.status(400).json({ error: 'Invalid or expired token.' });
  const passwordHash = await bcrypt.hash(newPassword, 10);
  user.passwordHash = passwordHash;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  res.json({ success: true, msg: 'Password reset successful.' });
});

/**
 * POST /api/auth/admin-resend-otp
 * Resend OTP to admin email
 * Body: { email }
 */
router.post('/admin-resend-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  const user = await User.findOne({ email });
  // Always respond with success to prevent email enumeration
  if (!user) return res.json({ success: true, msg: 'If your email is registered, you will receive an OTP.' });
  // Generate new OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 min
  user.otp = otp;
  user.otpExpires = otpExpires;
  await user.save();
  try {
    await sendOtpEmail(email, otp);
    res.json({ success: true, msg: 'If your email is registered, you will receive an OTP.' });
  } catch (err) {
    console.error('SendGrid OTP email error (admin-resend-otp):', err && err.stack ? err.stack : err);
    res.status(500).json({ error: 'Failed to send OTP email.' });
  }
});

/**
 * GET /api/auth/admin-users
 * Get all admin users (for admin management)
 */
router.get('/admin-users', async (req, res) => {
  try {
    const users = await User.find({}, { passwordHash: 0, otp: 0, otpExpires: 0, resetPasswordToken: 0, resetPasswordExpires: 0 });
    res.json({ success: true, users });
  } catch (err) {
    console.error('Error fetching admin users:', err);
    res.status(500).json({ error: 'Failed to fetch admin users' });
  }
});

/**
 * DELETE /api/auth/admin-users/:id
 * Delete an admin user
 */
router.delete('/admin-users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting the last admin user
    const totalUsers = await User.countDocuments();
    if (totalUsers <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last admin user' });
    }

    // Delete the user
    await User.findByIdAndDelete(id);
    res.json({ success: true, message: 'Admin user deleted successfully' });
  } catch (err) {
    console.error('Error deleting admin user:', err);
    res.status(500).json({ error: 'Failed to delete admin user' });
  }
});

/**
 * Middleware to verify JWT
 */
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * GET /api/auth/me
 * Get current user info (protected)
 */
router.get('/me', authMiddleware, async (req, res) => {
  res.json({ user: req.user });
});

module.exports = router; 