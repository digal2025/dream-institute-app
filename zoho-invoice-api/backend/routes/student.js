const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const bcrypt = require('bcryptjs');
const { sendOtpEmail, sendPasswordResetEmail } = require('../../services/sendgridService');
const crypto = require('crypto');

// Helper to normalize phone number (always returns with +91)
function normalizePhone(phone) {
  if (!phone) return phone;
  let p = phone.trim();
  if (p.startsWith('+91')) return p;
  p = p.replace(/^0+/, ''); // remove leading zeros
  if (p.length === 10) return '+91' + p;
  if (p.length === 13 && p.startsWith('91')) return '+' + p;
  return p;
}

// @route   POST /api/student/register
// @desc    Register a new student and send OTP (via email)
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ msg: 'Email and password are required.' });
    }
    let student = await Customer.findOne({ email: email.toLowerCase() });
    if (!student) {
      return res.status(404).json({ msg: 'No student found with this email. Please contact admin.' });
    }
    // If password is already set, student is registered
    if (student.password) {
      return res.status(400).json({ msg: 'You are already registered. Please login.' });
    }
    // Generate OTP and update student
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 min
    student.otp = otp;
    student.otpExpires = otpExpires;
    await student.save();
    try {
      await sendOtpEmail(email, otp);
      res.json({ msg: 'OTP sent via email. Please check your inbox.' });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      res.status(500).json({ msg: 'Failed to send OTP email. Please try again.' });
    }
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ msg: err.message || 'Server error during registration.' });
  }
});

// @route   POST /api/student/login
// @desc    Student login with phone/email and password
router.post('/login', async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || !password) {
      return res.status(400).json({ msg: 'Email and password are required.' });
    }

    // Find student by email
    let student = await Customer.findOne({ email: emailOrPhone.toLowerCase() });

    if (!student) {
      return res.status(400).json({ msg: 'Invalid credentials.' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials.' });
    }

    // Check if OTP verification is required
    if (student.otp && student.otpExpires && student.otpExpires > new Date()) {
      return res.status(400).json({ 
        msg: 'Please verify your OTP first.',
        requiresOtp: true 
      });
    }

    res.json({
      msg: 'Login successful',
      studentId: student.contact_id,
      mustChangePassword: student.mustChangePassword || false
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ msg: 'Server error during login.' });
  }
});

// @route   POST /api/student/send-otp
// @desc    Send OTP to student for verification
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ msg: 'Email is required.' });
    }

    const student = await Customer.findOne({ 
      email: email.toLowerCase() 
    });

    if (!student) {
      return res.status(404).json({ msg: 'Student not found.' });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    student.otp = otp;
    student.otpExpires = otpExpires;
    await student.save();

    // Send OTP via SendGrid email
    try {
      await sendOtpEmail(email, otp);
      res.json({ msg: 'OTP sent via email.' });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      res.status(500).json({ msg: 'Failed to send OTP email. Please try again.' });
    }
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ msg: err.message || 'Server error sending OTP.' });
  }
});

// @route   POST /api/student/verify-otp
// @desc    Verify OTP for student
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ msg: 'Email and OTP are required.' });
    }

    const student = await Customer.findOne({ email: email.toLowerCase() });

    if (!student) {
      return res.status(404).json({ msg: 'Student not found.' });
    }

    if (!student.otp || !student.otpExpires) {
      return res.status(400).json({ msg: 'No OTP found. Please request a new OTP.' });
    }

    if (student.otp !== otp) {
      return res.status(400).json({ msg: 'Invalid OTP.' });
    }

    if (student.otpExpires < new Date()) {
      return res.status(400).json({ msg: 'OTP has expired. Please request a new OTP.' });
    }

    // OTP is valid, clear it
    student.otp = null;
    student.otpExpires = null;
    await student.save();

    res.json({ 
      msg: 'OTP verified successfully.', 
      studentId: student.contact_id, 
      mustChangePassword: student.mustChangePassword || false 
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ msg: err.message || 'Server error verifying OTP.' });
  }
});

// @route   POST /api/student/change-password
// @desc    Change student password
router.post('/change-password', async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({ msg: 'Email, current password, and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ msg: 'Password must be at least 6 characters long.' });
    }
    const student = await Customer.findOne({ email: email.toLowerCase() });
    if (!student) {
      return res.status(404).json({ msg: 'Student not found.' });
    }
    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, student.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Current password is incorrect.' });
    }
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    student.password = hashedPassword;
    student.mustChangePassword = false;
    await student.save();
    res.json({ msg: 'Password changed successfully.' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ msg: err.message || 'Server error changing password.' });
  }
});

// @route   POST /api/student/reset-password-request
// @desc    Request password reset via email
router.post('/reset-password-request', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ msg: 'Email is required.' });
    }

    const student = await Customer.findOne({ email: email.toLowerCase() });
    
    // Always respond with success to prevent email enumeration
    if (!student) {
      return res.json({ msg: 'If your email is registered, you will receive a password reset link.' });
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date(Date.now() + 1000 * 60 * 15); // 15 min

    student.resetPasswordToken = token;
    student.resetPasswordExpires = tokenExpires;
    await student.save();

    // Send reset email
    try {
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/student/reset-password?token=${token}`;
      await sendPasswordResetEmail(email, resetUrl);
      res.json({ msg: 'If your email is registered, you will receive a password reset link.' });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      res.status(500).json({ msg: 'Failed to send reset email. Please try again.' });
    }
  } catch (err) {
    console.error('Reset password request error:', err);
    res.status(500).json({ msg: err.message || 'Server error sending reset link.' });
  }
});

// @route   POST /api/student/reset-password
// @desc    Reset password using token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ msg: 'Token and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ msg: 'Password must be at least 6 characters long.' });
    }

    const student = await Customer.findOne({ 
      resetPasswordToken: token, 
      resetPasswordExpires: { $gt: new Date() } 
    });

    if (!student) {
      return res.status(400).json({ msg: 'Invalid or expired token.' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    student.password = hashedPassword;
    student.resetPasswordToken = undefined;
    student.resetPasswordExpires = undefined;
    student.mustChangePassword = false;
    await student.save();

    res.json({ msg: 'Password reset successful.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ msg: err.message || 'Server error resetting password.' });
  }
});

// @route   GET /api/student/dashboard/:studentId
// @desc    Get student details and payments
router.get('/dashboard/:studentId', async (req, res) => {
  try {
    const student = await Customer.findOne({ contact_id: req.params.studentId });

    if (!student) {
      return res.status(404).json({ msg: 'Student not found' });
    }

    // Get all invoices for this student
    const invoices = await Invoice.find({ customer_id: req.params.studentId });
    const invoiced = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const outstanding = invoices.reduce((sum, inv) => sum + (inv.balance || 0), 0);

    // Get all payments for this student
    const payments = await Payment.find({ customer_id: req.params.studentId }).sort({ date: -1 });
    const paid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    res.json({
      studentDetails: student,
      paymentHistory: payments,
      kpi: {
        invoiced,
        paid,
        outstanding
      }
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ msg: 'Server error loading dashboard.' });
  }
});

module.exports = router; 