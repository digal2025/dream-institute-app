import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import { Visibility, VisibilityOff } from '@mui/icons-material';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Login failed');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      login(data.user, data.token);
      navigate('/dashboard');
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
          <Typography component="h1" variant="h4" sx={{ mb: 3, fontWeight: 'bold', color: '#6366f1' }}>
            Administrator Portal
          </Typography>
          <Typography component="p" sx={{ mb: 3, color: 'text.secondary' }}>
            Login to manage the fee management system.
          </Typography>
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
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
              onChange={e => setPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword((show) => !show)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
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
              onClick={() => navigate('/admin/reset-password')}
              sx={{
                display: 'block',
                mx: 'auto',
                color: '#6366f1',
                fontWeight: 600,
                textTransform: 'none',
                fontSize: 15,
                mb: 1
              }}
            >
              Forgot password?
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
} 