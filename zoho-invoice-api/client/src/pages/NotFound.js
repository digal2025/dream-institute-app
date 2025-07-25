import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Container } from '@mui/material';

const catUrl = 'https://cataas.com/cat/says/404%20Not%20Found!';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <Box sx={{ minHeight: '100vh', width: '100vw', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Container maxWidth="sm" sx={{ textAlign: 'center', p: 4, borderRadius: 4, background: 'rgba(255,255,255,0.95)', boxShadow: '0 4px 24px 0 rgba(99,102,241,0.10)' }}>
        <img src={catUrl} alt="404 Cat" style={{ maxWidth: '100%', borderRadius: 16, marginBottom: 32, boxShadow: '0 2px 8px #e0e7ff' }} />
        <Typography variant="h2" sx={{ fontWeight: 800, color: '#6366f1', mb: 2 }}>
          404 - Page Not Found
        </Typography>
        <Typography variant="h5" sx={{ color: '#374151', mb: 4 }}>
          Oops! The page you're looking for doesn't exist.<br />But here's a cat to cheer you up!
        </Typography>
        <Button variant="contained" color="primary" sx={{ fontWeight: 700, fontSize: 18, borderRadius: 2, px: 4, py: 1.5 }} onClick={() => navigate('/')}>Go Home</Button>
      </Container>
    </Box>
  );
} 