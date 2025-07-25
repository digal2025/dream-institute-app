import React from 'react';
import { Popover, Box, Typography, CircularProgress, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

/**
 * OutstandingPopover
 * Popover to show outstanding invoice, paid, and balance info for a customer.
 *
 * Props:
 * - open: boolean
 * - anchorEl: element
 * - onClose: function
 * - loading: boolean
 * - error: string|null
 * - content: object (should have customer, invoiced, paid, outstanding)
 * - origin: { anchorOrigin, transformOrigin }
 */
export default function OutstandingPopover({ open, anchorEl, onClose, loading, error, content, origin }) {
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={origin.anchorOrigin}
      transformOrigin={origin.transformOrigin}
      transitionDuration={300}
      PaperProps={{
        sx: {
          p: 2,
          boxShadow: '0 8px 32px 0 rgba(99,102,241,0.18), 0 1.5px 8px 0 rgba(0,0,0,0.08)',
          borderRadius: 3,
          m: 0,
          maxWidth: 420,
          width: 'auto',
          maxHeight: 'calc(100vh - 40px)',
          overflow: 'auto',
          position: 'relative',
          border: '1.5px solid #e0e7ff',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
          transition: 'box-shadow 0.3s cubic-bezier(.4,2,.6,1), transform 0.3s cubic-bezier(.4,2,.6,1)',
          opacity: 1
        }
      }}
    >
      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={{ position: 'absolute', right: 4, top: 4, zIndex: 2 }}
        size="small"
      >
        <CloseIcon fontSize="small" />
      </IconButton>
      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 80 }}>
          <CircularProgress size={28} />
        </Box>
      ) : error ? (
        <Typography sx={{ color: 'red' }}>{error}</Typography>
      ) : (
        <Box sx={{ minWidth: 260 }}>
          <Typography sx={{ fontWeight: 700, mb: 1, fontSize: 18 }}>{content.customer}</Typography>
          <Typography sx={{ mb: 1, fontSize: 16 }}>Course Fees: <b>₹{Number(content.invoiced || 0).toLocaleString()}</b></Typography>
          <Typography sx={{ mb: 1, fontSize: 16, color: '#059669' }}>Paid: <b>₹{Number(content.paid || 0).toLocaleString()}</b></Typography>
          <Typography sx={{ mb: 1, fontSize: 16, color: '#f59e42' }}>Outstanding: <b>₹{Number(content.outstanding || 0).toLocaleString()}</b></Typography>
        </Box>
      )}
    </Popover>
  );
} 