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
 * Body: { name, email, password, role }
 */
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
  
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already registered' });
    
    // Only the main admin can assign roles other than 'admin'
    let assignedRole = 'admin'; // Default role
    
    // Check if role assignment is being attempted
    if (role) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          const decoded = jwt.verify(token, JWT_SECRET);
          const currentUser = await User.findById(decoded.id);
          
          // Only allow role assignment by the main admin
          if (currentUser && currentUser.email === 'gitudigal@outlook.com') {
            assignedRole = role;
          }
        } catch (tokenErr) {
          // Invalid token, use default role
          console.log('Invalid token for role assignment, using default role');
        }
      }
    }
    
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, role: assignedRole });
    res.json({ 
      success: true, 
      user: { id: user._id, name: user.name, email: user.email, role: user.role } 
    });
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
  console.log('🔍 Login attempt:', { email, password: password ? '***' : 'missing' });
  
  if (!email || !password) return res.status(400).json({ error: 'All fields required' });
  
  try {
    console.log('🔍 Searching for user:', email);
    const user = await User.findOne({ email });
    console.log('🔍 User found:', !!user);
    
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    
    console.log('🔍 Comparing password...');
    const valid = await bcrypt.compare(password, user.passwordHash);
    console.log('🔍 Password valid:', valid);
    
    if (!valid) return res.status(400).json({ error: 'Invalid credentials' });
    
    console.log('🔍 Generating JWT token...');
    const token = jwt.sign({ id: user._id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    console.log('🔍 JWT token generated successfully');
    
    // User role and response data logging removed for security
    
    res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role || 'admin' } });
  } catch (err) {
    console.error('❌ Login error:', err);
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
  
  // Enhanced logging for debugging
  console.log('🔍 [ADMIN-RESET] Password reset request received');
  console.log('📧 [ADMIN-RESET] Email:', email);
  console.log('⏰ [ADMIN-RESET] Timestamp:', new Date().toISOString());
  
  if (!email) {
    console.log('❌ [ADMIN-RESET] No email provided');
    return res.status(400).json({ error: 'Email is required' });
  }
  
  try {
    console.log('🔍 [ADMIN-RESET] Searching for user in database...');
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ [ADMIN-RESET] User not found for email:', email);
      // Always respond with success to prevent email enumeration
      return res.json({ success: true, msg: 'If your email is registered, you will receive an OTP.' });
    }
    
    console.log('✅ [ADMIN-RESET] User found for password reset');
    
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 min
    
    console.log('🔢 [ADMIN-RESET] Generated OTP:', otp);
    console.log('⏰ [ADMIN-RESET] OTP expires at:', otpExpires.toISOString());
    
    // Save OTP to database
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();
    
    console.log('💾 [ADMIN-RESET] OTP saved to database successfully');
    
    // Send email
    console.log('📤 [ADMIN-RESET] Attempting to send OTP email...');
    console.log('📧 [ADMIN-RESET] From email:', process.env.SENDGRID_FROM_EMAIL);
    console.log('🔑 [ADMIN-RESET] API key set:', !!process.env.SENDGRID_API_KEY);
    
    const emailResult = await sendOtpEmail(email, otp);
    
    console.log('✅ [ADMIN-RESET] Email sent successfully!');
    console.log('📊 [ADMIN-RESET] SendGrid status:', emailResult[0]?.statusCode);
    console.log('🆔 [ADMIN-RESET] Message ID:', emailResult[0]?.headers?.['x-message-id']);
    
    res.json({ 
      success: true, 
      msg: 'If your email is registered, you will receive an OTP.',
      debug: {
        emailSent: true,
        statusCode: emailResult[0]?.statusCode,
        messageId: emailResult[0]?.headers?.['x-message-id']
      }
    });
    
  } catch (err) {
    console.error('❌ [ADMIN-RESET] Error occurred:');
    console.error('❌ [ADMIN-RESET] Error message:', err.message);
    console.error('❌ [ADMIN-RESET] Error stack:', err.stack);
    
    if (err.response) {
      console.error('❌ [ADMIN-RESET] SendGrid response:', err.response.body);
    }
    
    res.status(500).json({ 
      error: 'Failed to send OTP email.',
      debug: {
        errorMessage: err.message,
        errorType: err.name || 'Unknown'
      }
    });
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

/**
 * POST /api/auth/test-otp-email
 * Test endpoint to verify OTP email functionality
 * Body: { email }
 */
router.post('/test-otp-email', async (req, res) => {
  const { email } = req.body;
  
  console.log('🧪 [TEST-OTP] Test OTP endpoint called');
  console.log('📧 [TEST-OTP] Email:', email);
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required for testing' });
  }
  
  try {
    // Generate test OTP
    const testOtp = '123456';
    console.log('🔢 [TEST-OTP] Using test OTP:', testOtp);
    
    // Send test email
    console.log('📤 [TEST-OTP] Sending test OTP email...');
    const emailResult = await sendOtpEmail(email, testOtp);
    
    console.log('✅ [TEST-OTP] Test email sent successfully!');
    console.log('📊 [TEST-OTP] Status:', emailResult[0]?.statusCode);
    
    res.json({
      success: true,
      message: 'Test OTP email sent successfully',
      email: email,
      otp: testOtp,
      statusCode: emailResult[0]?.statusCode,
      messageId: emailResult[0]?.headers?.['x-message-id']
    });
    
  } catch (error) {
    console.error('❌ [TEST-OTP] Test failed:', error.message);
    res.status(500).json({
      error: 'Test OTP email failed',
      details: error.message
    });
  }
});

/**
 * POST /api/auth/change-password
 * Change user password (protected)
 * Body: { currentPassword, newPassword }
 */
router.post('/change-password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  // Validation
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }
  
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long' });
  }
  
  if (currentPassword === newPassword) {
    return res.status(400).json({ error: 'New password must be different from current password' });
  }
  
  try {
    // Get user from database
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    
    // Update password in database
    user.passwordHash = newPasswordHash;
    await user.save();
    
    console.log('🔄 Password changed successfully');
    
    res.json({ 
      success: true, 
      message: 'Password changed successfully' 
    });
    
  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

module.exports = router; 