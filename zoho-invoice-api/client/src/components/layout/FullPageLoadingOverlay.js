import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * FullPageLoadingOverlay
 * A full-page overlay with a large progress indicator and percentage.
 * Used for loading states that block the entire app/dashboard.
 *
 * @param {Object} props
 * @param {number} props.progress - The progress percentage (0-100)
 */
export default function FullPageLoadingOverlay({ progress }) {
  return (
    <Box sx={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      bgcolor: 'rgba(248,250,252,0.85)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
    }}>
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress variant="determinate" value={progress} size={72} thickness={5} color="primary" />
        <Box sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: 26,
          color: '#6366f1',
        }}>
          {`${Math.round(progress)}%`}
        </Box>
      </Box>
      <Box sx={{ mt: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={40} thickness={4.5} color="primary" sx={{ mr: 2 }} />
        <Typography sx={{ color: '#6366f1', fontSize: 20, fontWeight: 600 }}>Loading...</Typography>
      </Box>
    </Box>
  );
} 