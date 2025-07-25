import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, CircularProgress, MenuItem, Alert } from '@mui/material';
import debounce from '../../utils/debounce';

export default function AddCustomerDialog({ open, onClose, onSuccess, onNotify }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    cf_pgdca_course: '',
    cf_batch_name: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validation, setValidation] = useState({ name: '', email: '', phone: '' });
  const [success, setSuccess] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  // Auto-dismiss success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const checkDuplicate = useCallback(
    debounce(async (field, value) => {
      if (!value) return;
      setIsChecking(true);
      try {
        const res = await fetch('/api/mongo/customers/check-duplicates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [field]: value.trim() })
        });
        const data = await res.json();
        if (data.exists) {
          setValidation(prev => ({ ...prev, [field]: data.message }));
        } else {
          setValidation(prev => ({ ...prev, [field]: '' }));
        }
      } catch (err) {
        // Handle error silently
      } finally {
        setIsChecking(false);
      }
    }, 500),
    []
  );

  // Check if all required fields are filled and no validation errors
  const isFormValid = () => {
    return form.name.trim() !== '' && 
           form.email.trim() !== '' && 
           form.phone.trim() !== '' && 
           form.cf_pgdca_course !== '' && 
           form.cf_batch_name !== '' &&
           !validation.name &&
           !validation.email &&
           !validation.phone;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === 'name' || name === 'email' || name === 'phone') {
      checkDuplicate(name, value.trim());
    }
  };

  const validate = () => {
    let valid = true;
    let v = { name: '', email: '', phone: '' };
    // Email validation (optional, but if present must be valid)
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
      v.email = 'Invalid email address';
      valid = false;
    }
    // Phone validation (required, must be 10 digits)
    if (!form.phone) {
      v.phone = 'Phone is required';
      valid = false;
    } else if (!/^\d{10}$/.test(form.phone)) {
      v.phone = 'Phone must be 10 digits';
      valid = false;
    }
    setValidation(v);
    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Use the same validation as isFormValid
    if (!isFormValid()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null); // Clear previous success messages
    
    try {
      // Map form data to match backend schema
      const customerData = {
        customer_name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        cf_pgdca_course: form.cf_pgdca_course,
        cf_batch_name: form.cf_batch_name
      };
      
      const response = await fetch('/api/mongo/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Success - reset form and close dialog
        setForm({
          name: '',
          email: '',
          phone: '',
          cf_pgdca_course: '',
          cf_batch_name: ''
        });
        setValidation({ name: '', email: '', phone: '' });
        setError(null);
        setSuccess('Student added successfully!');
        onSuccess && onSuccess();
        onNotify && onNotify({ message: `Student "${form.name}" added successfully.`, time: new Date().toLocaleString() });
        // onClose(); // Removed automatic close
      } else {
        // API error
        throw new Error(data.error || 'Failed to add student');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error adding student:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm({
      name: '',
      email: '',
      phone: '',
      cf_pgdca_course: '',
      cf_batch_name: ''
    });
    setValidation({ name: '', email: '', phone: '' });
    setError(null);
    setSuccess(null);
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
      <DialogTitle sx={{ pb: 1, fontWeight: 700, fontSize: 22, background: '#f1f5f9', borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottom: '1.5px solid #e0e7ff', position: 'relative' }}>
        Add Student
      </DialogTitle>
      <DialogContent sx={{ p: 5 }}>
        <br></br>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TextField label="Name" name="name" value={form.name} onChange={handleChange} required fullWidth
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
            error={!!validation.name}
            helperText={validation.name}
          />
          <Box sx={{ position: 'relative', mb: 2 }}>
            <TextField
              label="Email"
              name="email"
              value={form.email}
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
              error={!!validation.email}
              helperText={validation.email}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Course" name="cf_pgdca_course" value={form.cf_pgdca_course} onChange={handleChange} select
              required
              fullWidth
              InputLabelProps={{ sx: { fontWeight: 400, color: '#6366f1', fontSize: 16 } }}
              sx={{
                width: '100%',
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
            >
              <MenuItem value="">Select Course</MenuItem>
              <MenuItem value="PGDCA">PGDCA</MenuItem>
              <MenuItem value="DCA">DCA</MenuItem>
              <MenuItem value="ADCA">ADCA</MenuItem>
            </TextField>
            <TextField label="Batch" name="cf_batch_name" value={form.cf_batch_name} onChange={handleChange} select
              required
              fullWidth
              InputLabelProps={{ sx: { fontWeight: 400, color: '#6366f1', fontSize: 16 } }}
              sx={{
                width: '100%',
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
            >
              <MenuItem value="">Select Batch</MenuItem>
              <MenuItem value="Batch 1">Batch 1</MenuItem>
              <MenuItem value="Batch 2">Batch 2</MenuItem>
              <MenuItem value="Batch 3">Batch 3</MenuItem>
              <MenuItem value="Batch 4">Batch 4</MenuItem>
              <MenuItem value="Batch 5">Batch 5</MenuItem>
            </TextField>
          </Box>
          <Box sx={{ position: 'relative', mb: 2 }}>
            <TextField
              label="Phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              onKeyPress={e => { if (!/[0-9]/.test(e.key)) e.preventDefault(); }}
              inputProps={{ maxLength: 10 }}
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
              error={!!validation.phone}
              helperText={validation.phone}
            />
            {success && (
              <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>
            )}
          </Box>
          {error && <Box sx={{ color: 'red', fontWeight: 600 }}>{error}</Box>}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 5, pb: 3 }}>
        <Button onClick={handleClose} disabled={loading}>Cancel</Button>
        <Button
          type="submit"
          variant="contained"
          disabled={!isFormValid() || loading || isChecking}
          onClick={handleSubmit}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontWeight: 600,
            fontSize: 16,
            padding: '12px 32px',
            borderRadius: 3,
            textTransform: 'none',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
              boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
            },
            '&:disabled': {
              background: '#e0e7ff',
              color: '#94a3b8',
              boxShadow: 'none',
            },
          }}
        >
          {loading || isChecking ? <CircularProgress size={20} color="inherit" /> : 'Add Student'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 