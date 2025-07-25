import React from 'react';
import { Popover, Box, Typography, CircularProgress, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

/**
 * PaymentPopover
 * Popover to show payment details for a customer and month.
 *
 * Props:
 * - open: boolean
 * - anchorEl: element
 * - onClose: function
 * - loading: boolean
 * - error: string|null
 * - content: object (should have customer, month, amount, details)
 * - origin: { anchorOrigin, transformOrigin }
 * - formatMonthLabel: function
 * - formatDateDMY: function
 */
export default function PaymentPopover({ open, anchorEl, onClose, loading, error, content, origin, formatMonthLabel, formatDateDMY }) {
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
      <Typography sx={{ fontWeight: 700, mb: 1 }}>
        {content.customer} <span style={{ color: '#6366f1' }}>{content.month && formatMonthLabel(content.month.replace('paid_', ''))}</span>
      </Typography>
      {content.amount > 0 ? (
        <>
          <Typography sx={{ mb: 1 }}>Amount Paid: <b>₹{Number(content.amount).toLocaleString()}</b></Typography>
          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 60 }}>
              <CircularProgress size={22} />
            </Box>
          ) : error ? (
            <Typography sx={{ color: 'red' }}>{error}</Typography>
          ) : content.details && content.details.length > 0 ? (
            <TableContainer sx={{ background: '#f9fafb', borderRadius: 1, boxShadow: 0, mb: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, fontSize: 15 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: 15 }}>Amount</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: 15 }}>Reference</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {content.details.map((d, i) => (
                    <TableRow key={i} sx={{ background: i % 2 === 0 ? '#f3f4f6' : '#fff', '&:last-child td, &:last-child th': { border: 0 }, transition: 'background 0.2s', }}>
                      <TableCell sx={{ py: 1.2, px: 2 }}>{formatDateDMY(d.date)}</TableCell>
                      <TableCell sx={{ py: 1.2, px: 2 }}>₹{Number(d.amount).toLocaleString()}</TableCell>
                      <TableCell sx={{ py: 1.2, px: 2 }}>{d.reference_number}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography sx={{ color: '#888' }}>No payment details for this month.</Typography>
          )}
        </>
      ) : (
        <Typography sx={{ color: '#888' }}>No payment details.</Typography>
      )}
    </Popover>
  );
} 