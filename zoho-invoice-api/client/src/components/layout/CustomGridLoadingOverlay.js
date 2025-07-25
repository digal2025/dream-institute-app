import React from 'react';
import { Box, CircularProgress } from '@mui/material';

/**
 * CustomGridLoadingOverlay
 * A full-screen loading overlay for use with DataGrid refreshes.
 * Shows a centered Material-UI CircularProgress spinner.
 */
export default function CustomGridLoadingOverlay() {
  return (
    <Box sx={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      bgcolor: 'rgba(248,250,252,0.65)',
      zIndex: 2001,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <CircularProgress color="primary" size={56} thickness={4.5} />
    </Box>
  );
} 