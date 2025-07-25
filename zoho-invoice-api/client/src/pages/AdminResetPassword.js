import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

function AdminResetPassword() {
  const navigate = useNavigate();
  // Step: 'request' | 'otp' | 'reset'
  const [step, setStep] = useState('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [token, setToken] = useState('');
  const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [otpResent, setOtpResent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/auth/admin-reset-password-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP.');
      setSuccess('If your email is registered, you will receive an OTP.');
      setStep('otp');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/auth/admin-verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'OTP verification failed.');
      setToken(data.token);
      setSuccess('OTP verified! Please enter your new password.');
      setStep('reset');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/auth/admin-reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: formData.newPassword })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to reset password.');
      setSuccess('Password reset successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/auth/admin-resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resend OTP.');
      setOtpResent(true);
      setResendTimer(30);
      setSuccess('OTP resent successfully!');
      // Start timer
      const interval = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 1) { clearInterval(interval); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <Box sx={{ minHeight: '100vh', width: '100vw', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Container component="main" maxWidth="xs" disableGutters sx={{ p: 0 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: 4,
            borderRadius: 3,
            boxShadow: '0 4px 24px 0 rgba(99,102,241,0.10)',
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(6px)',
          }}
        >
          <Typography component="h1" variant="h4" sx={{ fontWeight: 700, color: '#1f2937', mb: 1, textAlign: 'center' }}>
            Reset Admin Password
          </Typography>
          <Typography variant="body1" sx={{ color: '#6b7280', mb: 4, textAlign: 'center' }}>
            {step === 'request' && 'Enter your email to receive an OTP.'}
            {step === 'otp' && 'Enter the OTP sent to your email.'}
            {step === 'reset' && 'Enter your new password below.'}
          </Typography>

          {/* Step 1: Request OTP */}
          {step === 'request' && (
            <Box component="form" onSubmit={handleRequestOtp} noValidate sx={{ width: '100%' }}>
              {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
              {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={e => setEmail(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading || !email}
                sx={{
                  padding: '14px 0',
                  fontWeight: 700,
                  fontSize: 18,
                  borderRadius: 2,
                  background: 'linear-gradient(90deg, #6366f1 0%, #818CF8 100%)',
                  boxShadow: '0 2px 8px #6366f122',
                  letterSpacing: 0.5,
                  textTransform: 'none',
                  transition: 'all 0.2s',
                  '&:hover': {
                    background: 'linear-gradient(90deg, #4f46e5 0%, #6366f1 100%)',
                    boxShadow: '0 4px 16px #6366f144'
                  },
                  '&:disabled': {
                    background: '#e0e0e0',
                    color: '#a0a0a0',
                    boxShadow: 'none'
                  },
                }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Send OTP'}
              </Button>
              <Button
                variant="text"
                onClick={() => navigate('/login')}
                sx={{ mt: 2, color: '#6366f1', fontWeight: 600, textTransform: 'none', fontSize: 15 }}
              >
                Back to Login
              </Button>
            </Box>
          )}

          {/* Step 2: Verify OTP */}
          {step === 'otp' && (
            <Box component="form" onSubmit={handleVerifyOtp} noValidate sx={{ width: '100%' }}>
              {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
              {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}
              <Typography sx={{ mb: 2, color: '#6366f1', fontWeight: 600, textAlign: 'center' }}>
                OTP sent to <b>{email}</b>
              </Typography>
              <TextField
                margin="normal"
                required
                fullWidth
                id="otp"
                label="OTP"
                name="otp"
                autoComplete="one-time-code"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Button
                variant="outlined"
                fullWidth
                onClick={handleResendOtp}
                disabled={loading || resendTimer > 0}
                sx={{ mb: 2, fontWeight: 600, textTransform: 'none' }}
              >
                {resendTimer > 0 ? `Resend OTP (${resendTimer}s)` : 'Resend OTP'}
              </Button>
              {otpResent && (
                <Typography sx={{ color: 'green', mb: 2, textAlign: 'center', fontSize: 15 }}>
                  OTP resent successfully!
                </Typography>
              )}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading || !otp}
                sx={{
                  padding: '14px 0',
                  fontWeight: 700,
                  fontSize: 18,
                  borderRadius: 2,
                  background: 'linear-gradient(90deg, #6366f1 0%, #818CF8 100%)',
                  boxShadow: '0 2px 8px #6366f122',
                  letterSpacing: 0.5,
                  textTransform: 'none',
                  transition: 'all 0.2s',
                  '&:hover': {
                    background: 'linear-gradient(90deg, #4f46e5 0%, #6366f1 100%)',
                    boxShadow: '0 4px 16px #6366f144'
                  },
                  '&:disabled': {
                    background: '#e0e0e0',
                    color: '#a0a0a0',
                    boxShadow: 'none'
                  },
                }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Verify OTP'}
              </Button>
              <Button
                variant="text"
                onClick={() => setStep('request')}
                sx={{ mt: 2, color: '#6366f1', fontWeight: 600, textTransform: 'none', fontSize: 15 }}
              >
                Back
              </Button>
            </Box>
          )}

          {/* Step 3: Reset Password */}
          {step === 'reset' && (
            <Box component="form" onSubmit={handleResetPassword} noValidate sx={{ width: '100%' }}>
              {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
              {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}
              <TextField
                margin="normal"
                required
                fullWidth
                name="newPassword"
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                id="newPassword"
                autoComplete="new-password"
                value={formData.newPassword}
                onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm New Password"
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading || !formData.newPassword || !formData.confirmPassword}
                sx={{
                  padding: '14px 0',
                  fontWeight: 700,
                  fontSize: 18,
                  borderRadius: 2,
                  background: 'linear-gradient(90deg, #6366f1 0%, #818CF8 100%)',
                  boxShadow: '0 2px 8px #6366f122',
                  letterSpacing: 0.5,
                  textTransform: 'none',
                  transition: 'all 0.2s',
                  '&:hover': {
                    background: 'linear-gradient(90deg, #4f46e5 0%, #6366f1 100%)',
                    boxShadow: '0 4px 16px #6366f144'
                  },
                  '&:disabled': {
                    background: '#e0e0e0',
                    color: '#a0a0a0',
                    boxShadow: 'none'
                  },
                }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Reset Password'}
              </Button>
              <Button
                variant="text"
                onClick={() => navigate('/login')}
                sx={{ mt: 2, color: '#6366f1', fontWeight: 600, textTransform: 'none', fontSize: 15 }}
              >
                Back to Login
              </Button>
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
}

export default AdminResetPassword; 