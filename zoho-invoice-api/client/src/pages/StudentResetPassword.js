import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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

function StudentResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [token]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
      return;
    }

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
      const response = await fetch('/api/student/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          newPassword: formData.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Password reset successful! Redirecting to login...');
        setTimeout(() => {
          navigate('/student/login');
        }, 2000);
      } else {
        setError(data.msg || 'Failed to reset password. Please try again.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
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
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              Invalid reset link. Please request a new password reset.
            </Alert>
            <Button
              variant="contained"
              onClick={() => navigate('/student/login')}
              sx={{
                fontWeight: 700,
                borderRadius: 2,
                background: 'linear-gradient(90deg, #6366f1 0%, #818CF8 100%)',
                textTransform: 'none'
              }}
            >
              Back to Login
            </Button>
          </Box>
        </Container>
      </Box>
    );
  }

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
            Reset Password
          </Typography>
          <Typography variant="body1" sx={{ color: '#6b7280', mb: 4, textAlign: 'center' }}>
            Enter your new password below
          </Typography>

          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            {success && (
              <Alert severity="success" sx={{ mb: 3 }}>
                {success}
              </Alert>
            )}

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
              onChange={handleChange}
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
              onChange={handleChange}
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
              onClick={() => navigate('/student/login')}
              sx={{
                mt: 2,
                color: '#6366f1',
                fontWeight: 600,
                textTransform: 'none',
                fontSize: 15
              }}
            >
              Back to Login
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

export default StudentResetPassword; 