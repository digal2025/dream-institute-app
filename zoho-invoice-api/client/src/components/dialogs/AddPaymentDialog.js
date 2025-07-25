import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, CircularProgress, MenuItem, Autocomplete } from '@mui/material';

export default function AddPaymentDialog({ open, onClose, onSuccess, onNotify }) {
  const [form, setForm] = useState({
    customer_id: '',
    date: '',
    amount: '',
    payment_mode: '',
    reference_number: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [fetchingCustomers, setFetchingCustomers] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      setFetchingCustomers(true);
      fetch('/api/mongo/customers?page=1&limit=1000')
        .then(res => res.json())
        .then(data => {
          setCustomers(data.customers || []);
          setFetchingCustomers(false);
        })
        .catch(() => setFetchingCustomers(false));
    }
  }, [open]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/mongo/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok || !data.payment) throw new Error(data.error || 'Failed to add payment');
      setLoading(false);
      setSuccess(true);
      onSuccess && onSuccess();
      const studentName = customers.find(c => c.contact_id === form.customer_id)?.customer_name || 'a student';
      onNotify && onNotify({ message: `Payment of ₹${form.amount} added for ${studentName}.`, time: new Date().toLocaleString() });
      // Don't close dialog immediately
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setForm({
      customer_id: '',
      date: '',
      amount: '',
      payment_mode: '',
      reference_number: ''
    });
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          background: 'linear-gradient(135deg, #e0e7ff 0%, #f1f5f9 100%)',
          boxShadow: '0 8px 32px 0 rgba(99,102,241,0.12), 0 1.5px 8px 0 rgba(0,0,0,0.08)',
          p: 0
        }
      }}
    >
      <DialogTitle sx={{ pb: 2, fontWeight: 700, fontSize: 22, background: '#f1f5f9', borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottom: '1.5px solid #e0e7ff', position: 'relative' }}>
        Add Payment
      </DialogTitle>
    
      <DialogContent sx={{ p: 5, mt: 1.5 }}>
        {!success ? (
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Autocomplete
            options={customers}
            getOptionLabel={option => option.customer_name || ''}
            loading={fetchingCustomers}
            loadingText="Loading students..."
            value={customers.find(c => c.contact_id === form.customer_id) || null}
            onChange={(_, newValue) => setForm(f => ({ ...f, customer_id: newValue ? newValue.contact_id : '' }))}
            isOptionEqualToValue={(option, value) => option.contact_id === value.contact_id}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Customer"
                required
                fullWidth
                InputLabelProps={{ sx: { fontWeight: 400, color: '#6366f1', fontSize: 16 } }}
                sx={{
                  background: '#f8fafc',
                  borderRadius: 2,
                  boxShadow: '0 1px 4px #e0e7ff',
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
            )}
            sx={{
              '& .MuiAutocomplete-listbox': {
                background: '#fff',
                borderRadius: 2,
                boxShadow: '0 4px 16px #6366f133',
                fontSize: 16,
                color: '#222',
                p: 1,
              },
              '& .MuiAutocomplete-option': {
                py: 1.5,
                px: 2.5,
                borderRadius: 2,
                mb: 0.5,
                transition: 'background 0.2s',
                '&[aria-selected="true"]': {
                  background: '#e0e7ff',
                  color: '#3730a3',
                },
                '&:hover': {
                  background: '#f1f5f9',
                },
              },
              mb: 1
            }}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Date"
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              required
              fullWidth
              InputLabelProps={{ shrink: true, sx: { fontWeight: 400, color: '#6366f1', fontSize: 16 } }}
              sx={{
                background: '#f8fafc',
                borderRadius: 2,
                boxShadow: '0 1px 4px #e0e7ff',
                width: '50%',
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
              label="Amount"
              name="amount"
              type="number"
              value={form.amount}
              onChange={handleChange}
              required
              fullWidth
              InputLabelProps={{ sx: { fontWeight: 400, color: '#6366f1', fontSize: 16 } }}
              sx={{
                background: '#f8fafc',
                borderRadius: 2,
                boxShadow: '0 1px 4px #e0e7ff',
                width: '50%',
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
          </Box>
          <TextField
            label="Payment Mode"
            name="payment_mode"
            value={form.payment_mode}
            onChange={handleChange}
            required
            fullWidth
            InputLabelProps={{ sx: { fontWeight: 400, color: '#6366f1', fontSize: 16 } }}
            sx={{
              background: '#f8fafc',
              borderRadius: 2,
              boxShadow: '0 1px 4px #e0e7ff',
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
            label="Reference"
            name="reference_number"
            value={form.reference_number}
            onChange={handleChange}
            fullWidth
            InputLabelProps={{ sx: { fontWeight: 400, color: '#6366f1', fontSize: 16 } }}
            sx={{
              background: '#f8fafc',
              borderRadius: 2,
              boxShadow: '0 1px 4px #e0e7ff',
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
            {error && <Box sx={{ color: 'red', fontWeight: 600 }}>{error}</Box>}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 180, gap: 2, position: 'relative' }}>
            <Box sx={{ zIndex: 2, position: 'relative', width: '100%' }}>
              <Box sx={{ fontSize: 48, color: '#22c55e', mb: 1, textAlign: 'center' }}>✓</Box>
              <Box sx={{ fontWeight: 700, fontSize: 22, color: '#22c55e', mb: 1, textAlign: 'center' }}>Payment Added!</Box>
              <Box sx={{ color: '#222', fontSize: 16, mb: 2, textAlign: 'center' }}>The payment was successfully added.</Box>
            </Box>
            {loading && (
              <Box sx={{ mt: 2, zIndex: 1, display: 'flex', justifyContent: 'center', width: '100%' }}>
                <CircularProgress size={32} />
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 5, pb: 3 }}>
        {!success ? (
          <>
            <Button onClick={handleClose} disabled={loading}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained" color="primary" disabled={loading} startIcon={loading ? <CircularProgress size={18} /> : null} sx={{ fontWeight: 700, borderRadius: 2, fontSize: 16, px: 3, py: 1.2 }}>
              Add Payment
            </Button>
          </>
        ) : (
          <Button onClick={handleClose} variant="contained" color="primary" sx={{ fontWeight: 700, borderRadius: 2, fontSize: 16, px: 3, py: 1.2 }}>
            Close
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
} 