import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext'; // Correctly import useAuth
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Paper from '@mui/material/Paper';

function StudentLogin() {
  const [tab, setTab] = useState(0); // 0 = Login, 1 = Register
  // Login state
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  // Register state
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  // OTP state
  const [otpStep, setOtpStep] = useState(false); // true if waiting for OTP
  const [otpEmail, setOtpEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  // General
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpResent, setOtpResent] = useState(false);
  const navigate = useNavigate();
  // const { login } = useAuth(); // This is for admin auth, not student. We can remove it.
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/student/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailOrPhone, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if OTP verification is required
        if (data.requiresOtp) {
          setOtpStep(true);
          setOtpEmail(emailOrPhone.includes('@') ? '' : emailOrPhone);
          setError('Please verify your OTP to complete login.');
          return;
        }
        throw new Error(data.msg || 'Login failed');
      }

      // Login successful
      localStorage.setItem('studentId', data.studentId);

      // Check if password change is required
      if (data.mustChangePassword) {
        setMustChangePassword(true);
        setOtpEmail(emailOrPhone.includes('@') ? '' : emailOrPhone);
      } else {
        navigate(`/student/dashboard/${data.studentId}`);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Registration handler: only email and password, and only proceed if email exists
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (!regEmail || !regPassword) {
        setError('Email and password are required.');
        setLoading(false);
        return;
      }
      const res = await fetch('/api/student/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail, password: regPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.msg && data.msg.includes('already registered')) {
          setError('You are already registered. Please login.');
          setTab(0); // Switch to login tab
          setLoading(false);
          return;
        }
        throw new Error(data.msg || 'Failed to send OTP.');
      }
      setOtpStep(true);
      setOtpEmail(regEmail);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // OTP verification handler
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/student/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'OTP verification failed');
      localStorage.setItem('studentId', data.studentId);
      if (data.mustChangePassword) {
        setMustChangePassword(true);
      } else {
        navigate(`/student/dashboard/${data.studentId}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Password change handler
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/student/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Password change failed');
      navigate(`/student/dashboard/${localStorage.getItem('studentId')}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    setLoading(true);
    setError('');
    setOtpResent(false);
    try {
      const res = await fetch('/api/student/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to resend OTP');
      setOtpResent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Reset password request handler
  const handleResetRequest = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMsg('');
    try {
      const res = await fetch('http://localhost:3000/api/student/reset-password-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail })
      });
      const data = await res.json();
      setResetMsg(data.msg || 'If your email is registered, you will receive a password reset link.');
    } catch (err) {
      setResetMsg('Something went wrong. Please try again.');
    } finally {
      setResetLoading(false);
    }
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
          <Typography component="h1" variant="h4" sx={{ mb: 3, fontWeight: 'bold', color: '#6366f1' }}>
            Student Portal
          </Typography>
          <Typography component="p" sx={{ mb: 3, color: 'text.secondary' }}>
            Access your fee payment details.
          </Typography>
          <Tabs value={tab} onChange={(_, v) => { setTab(v); setError(''); setOtpStep(false); setMustChangePassword(false); }} sx={{ mb: 2, width: '100%' }} centered>
            <Tab label="Login" />
            <Tab label="Register" />
          </Tabs>

          {/* Register Form */}
          {tab === 1 && !otpStep && !mustChangePassword && (
            <Box component="form" onSubmit={handleRegister} noValidate sx={{ mt: 1, width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="regEmail"
                label="Email"
                name="regEmail"
                autoComplete="email"
                value={regEmail}
                onChange={e => setRegEmail(e.target.value)}
                sx={{
                  background: '#f8fafc',
                  borderRadius: 2,
                  boxShadow: '0 1px 4px #e0e7ff44',
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    fontSize: 17,
                    fontWeight: 500,
                    color: '#222',
                    background: '#f8fafc',
                    '& fieldset': { borderColor: '#e0e7ff' },
                    '&:hover fieldset': { borderColor: '#6366f1' },
                    '&.Mui-focused fieldset': { borderColor: '#6366f1', borderWidth: 2 },
                  },
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                id="regPassword"
                label="Password"
                name="regPassword"
                type={showRegPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={regPassword}
                onChange={e => setRegPassword(e.target.value)}
                sx={{
                  background: '#f8fafc',
                  borderRadius: 2,
                  boxShadow: '0 1px 4px #e0e7ff44',
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    fontSize: 17,
                    fontWeight: 500,
                    color: '#222',
                    background: '#f8fafc',
                    '& fieldset': { borderColor: '#e0e7ff' },
                    '&:hover fieldset': { borderColor: '#6366f1' },
                    '&.Mui-focused fieldset': { borderColor: '#6366f1', borderWidth: 2 },
                  },
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowRegPassword(v => !v)} edge="end">
                        {showRegPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              {error && <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{error}</Alert>}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{ mt: 3, mb: 2, padding: '14px 0', fontWeight: 700, fontSize: 18, borderRadius: 2, background: 'linear-gradient(90deg, #6366f1 0%, #818CF8 100%)', boxShadow: '0 2px 8px #6366f122', letterSpacing: 0.5, textTransform: 'none', transition: 'all 0.2s', '&:hover': { background: 'linear-gradient(90deg, #4f46e5 0%, #6366f1 100%)', boxShadow: '0 4px 16px #6366f144' }, '&:disabled': { background: '#e0e0e0', color: '#a0a0a0', boxShadow: 'none' }, }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Register'}
              </Button>
            </Box>
          )}
          {/* OTP Verification Form */}
          {otpStep && !mustChangePassword && (
            <Box component="form" onSubmit={handleVerifyOtp} noValidate sx={{ mt: 1, width: '100%' }}>
              <Typography sx={{ mb: 2, color: '#6366f1', fontWeight: 600 }}>
                Enter the OTP sent to your email{otpEmail ? ` (${otpEmail})` : ''}
              </Typography>
              <TextField
                margin="normal"
                required
                fullWidth
                id="otp"
                label="OTP"
                name="otp"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                sx={{ background: '#f8fafc', borderRadius: 2, boxShadow: '0 1px 4px #e0e7ff44', mb: 2 }}
              />
              <Button
                onClick={handleResendOtp}
                disabled={loading}
                variant="text"
                sx={{ mb: 2, color: '#6366f1', fontWeight: 600, textTransform: 'none', fontSize: 15 }}
              >
                Resend OTP
              </Button>
              {otpResent && (
                <Alert severity="success" sx={{ width: '100%', mb: 1, mt: -1 }}>
                  OTP resent successfully!
                </Alert>
              )}
              {error && <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{error}</Alert>}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{ mt: 3, mb: 2, padding: '14px 0', fontWeight: 700, fontSize: 18, borderRadius: 2, background: 'linear-gradient(90deg, #6366f1 0%, #818CF8 100%)', boxShadow: '0 2px 8px #6366f122', letterSpacing: 0.5, textTransform: 'none', transition: 'all 0.2s', '&:hover': { background: 'linear-gradient(90deg, #4f46e5 0%, #6366f1 100%)', boxShadow: '0 4px 16px #6366f144' }, '&:disabled': { background: '#e0e0e0', color: '#a0a0a0', boxShadow: 'none' }, }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Verify OTP'}
              </Button>
            </Box>
          )}
          {/* Password Change Form */}
          {mustChangePassword && (
            <Box component="form" onSubmit={handleChangePassword} noValidate sx={{ mt: 1, width: '100%' }}>
              <Typography sx={{ mb: 2, color: '#6366f1', fontWeight: 600 }}>Change your password to continue</Typography>
              <TextField
                margin="normal"
                required
                fullWidth
                id="newPassword"
                label="New Password"
                name="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                sx={{ background: '#f8fafc', borderRadius: 2, boxShadow: '0 1px 4px #e0e7ff44', mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: 17, fontWeight: 500, color: '#222', background: '#f8fafc', '& fieldset': { borderColor: '#e0e7ff' }, '&:hover fieldset': { borderColor: '#6366f1' }, '&.Mui-focused fieldset': { borderColor: '#6366f1', borderWidth: 2 }, }, }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowNewPassword(v => !v)} edge="end">
                        {showNewPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              {error && <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{error}</Alert>}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{ mt: 3, mb: 2, padding: '14px 0', fontWeight: 700, fontSize: 18, borderRadius: 2, background: 'linear-gradient(90deg, #6366f1 0%, #818CF8 100%)', boxShadow: '0 2px 8px #6366f122', letterSpacing: 0.5, textTransform: 'none', transition: 'all 0.2s', '&:hover': { background: 'linear-gradient(90deg, #4f46e5 0%, #6366f1 100%)', boxShadow: '0 4px 16px #6366f144' }, '&:disabled': { background: '#e0e0e0', color: '#a0a0a0', boxShadow: 'none' }, }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Change Password'}
              </Button>
            </Box>
          )}
          {/* Login Form (default) */}
          {tab === 0 && !otpStep && !mustChangePassword && (
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="emailOrPhone"
                label="Email or Phone Number"
                name="emailOrPhone"
                autoComplete="email"
                autoFocus
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                sx={{
                  background: '#f8fafc',
                  borderRadius: 2,
                  boxShadow: '0 1px 4px #e0e7ff44',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    fontSize: 17,
                    fontWeight: 500,
                    color: '#222',
                    background: '#f8fafc',
                    '& fieldset': { borderColor: '#e0e7ff' },
                    '&:hover fieldset': { borderColor: '#6366f1' },
                    '&.Mui-focused fieldset': { borderColor: '#6366f1', borderWidth: 2 },
                  },
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                id="password"
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{
                  background: '#f8fafc',
                  borderRadius: 2,
                  boxShadow: '0 1px 4px #e0e7ff44',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    fontSize: 17,
                    fontWeight: 500,
                    color: '#222',
                    background: '#f8fafc',
                    '& fieldset': { borderColor: '#e0e7ff' },
                    '&:hover fieldset': { borderColor: '#6366f1' },
                    '&.Mui-focused fieldset': { borderColor: '#6366f1', borderWidth: 2 },
                  },
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword((v) => !v)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              {error && <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{error}</Alert>}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{ mt: 3, mb: 2, padding: '14px 0', fontWeight: 700, fontSize: 18, borderRadius: 2, background: 'linear-gradient(90deg, #6366f1 0%, #818CF8 100%)', boxShadow: '0 2px 8px #6366f122', letterSpacing: 0.5, textTransform: 'none', transition: 'all 0.2s', '&:hover': { background: 'linear-gradient(90deg, #4f46e5 0%, #6366f1 100%)', boxShadow: '0 4px 16px #6366f144' }, '&:disabled': { background: '#e0e0e0', color: '#a0a0a0', boxShadow: 'none' }, }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Login'}
              </Button>
              <Button
                variant="text"
                sx={{ color: '#6366f1', fontWeight: 600, textTransform: 'none', fontSize: 15, mb: 1 }}
                onClick={() => { setShowResetDialog(true); setResetEmail(''); setResetMsg(''); }}
              >
                Forgot password?
              </Button>
            </Box>
          )}
        </Box>
      </Container>
      {/* Reset Password Dialog */}
      <Dialog open={showResetDialog} onClose={() => setShowResetDialog(false)} maxWidth="xs" fullWidth>
        <Paper elevation={6} sx={{ borderRadius: 2.5, p: 0, background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)', boxShadow: '0 8px 32px 0 rgba(99,102,241,0.10)' }}>
          <DialogTitle sx={{ fontWeight: 700, fontSize: 22, color: '#4f46e5', pb: 0, pt: 3, textAlign: 'center', background: 'transparent' }}>Reset Password</DialogTitle>
          <DialogContent sx={{ pt: 2, pb: 1, px: 4 }}>
            <Box component="form" onSubmit={handleResetRequest} sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="resetEmail"
                label="Registered Email"
                name="resetEmail"
                autoComplete="email"
                value={resetEmail}
                onChange={e => setResetEmail(e.target.value)}
                sx={{
                  background: '#fff',
                  borderRadius: 2.5,
                  boxShadow: '0 1px 4px #e0e7ff33',
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2.5,
                    fontSize: 16,
                    fontWeight: 500,
                    color: '#222',
                    background: '#fff',
                    '& fieldset': { borderColor: '#e0e7ff' },
                    '&:hover fieldset': { borderColor: '#6366f1' },
                    '&.Mui-focused fieldset': { borderColor: '#6366f1', borderWidth: 2 },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#6366f1',
                  }
                }}
              />
              {resetMsg && <Alert severity="info" sx={{ mb: 2 }}>{resetMsg}</Alert>}
              <DialogActions sx={{ px: 0, pb: 2, pt: 1 }}>
                <Button onClick={() => setShowResetDialog(false)} sx={{ fontWeight: 600, borderRadius: 2.5, px: 3, py: 1, textTransform: 'none' }}>Cancel</Button>
                <Button type="submit" variant="contained" disabled={resetLoading || !resetEmail} sx={{ fontWeight: 700, borderRadius: 2.5, px: 3, py: 1.2, textTransform: 'none', background: 'linear-gradient(90deg, #6366f1 0%, #818CF8 100%)', color: 'white', boxShadow: '0 4px 15px rgba(102, 126, 234, 0.10)', '&:hover': { background: 'linear-gradient(90deg, #4f46e5 0%, #6366f1 100%)', boxShadow: '0 6px 20px rgba(102, 126, 234, 0.18)' }, '&:disabled': { background: '#e0e7ff', color: '#94a3b8', boxShadow: 'none' } }}>
                  {resetLoading ? <CircularProgress size={20} /> : 'Send Reset Link'}
                </Button>
              </DialogActions>
            </Box>
          </DialogContent>
        </Paper>
      </Dialog>
    </Box>
  );
}

export default StudentLogin; 