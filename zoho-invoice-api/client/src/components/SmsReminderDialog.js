import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  CircularProgress,
  Alert,
  MenuItem,
  Select,
  FormControl,
  Button
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Send as SendIcon, Close as CloseIcon } from '@mui/icons-material';

export default function SmsReminderDialog({ open, onClose, onNotify }) {
  const [unpaidStudents, setUnpaidStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [sendingTo, setSendingTo] = useState(new Set());
  const [selectedMonth, setSelectedMonth] = useState('');
  const [monthOptions, setMonthOptions] = useState([]);

  useEffect(() => {
    if (open) {
      const now = new Date();
      const months = Array.from({ length: 12 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      });
      setMonthOptions(months);
      setSelectedMonth(months[0]);
    }
  }, [open]);

  useEffect(() => {
    if (open && selectedMonth) {
      fetchUnpaidStudents(selectedMonth);
    }
  }, [selectedMonth, open]);

  const fetchUnpaidStudents = async (month) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/sms/unpaid-students?month=${month}`);
      const data = await response.json();
      if (data.success) {
        setUnpaidStudents(data.students.map(s => ({ ...s, id: s.contact_id })));
      } else {
        setError(data.error || 'Failed to fetch unpaid students');
      }
    } catch (err) {
      setError('Failed to fetch unpaid students');
    } finally {
      setLoading(false);
    }
  };

  const sendReminderToStudent = async (student) => {
    setSendingTo(prev => new Set(prev).add(student.id));
    try {
      const response = await fetch('/api/sms/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          studentName: student.customer_name,
          course: student.cf_pgdca_course,
          batch: student.cf_batch_name
        })
      });
      const data = await response.json();
      if (data.success) {
        onNotify && onNotify({ message: `Fee reminder email sent to ${student.email}` });
        setSuccess(`Fee reminder email sent to ${student.email}`);
      } else {
        setError(`Failed to send reminder: ${data.error}`);
      }
    } catch (err) {
      setError('Failed to send reminder');
    } finally {
      setSendingTo(prev => {
        const newSet = new Set(prev);
        newSet.delete(student.id);
        return newSet;
      });
    }
  };
  
  const sendBulkReminders = async () => {
    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch('/api/sms/send-bulk-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: selectedMonth })
      });
      const data = await response.json();
      if (data.success) {
        onNotify && onNotify({ message: `Sent bulk WhatsApp reminders. ${data.successful} successful, ${data.failed} failed.` });
        setSuccess(data.message);
      } else {
        setError(data.error || 'Failed to send bulk reminders');
      }
    } catch (err) {
      setError('Failed to send bulk reminders');
    } finally {
      setSending(false);
    }
  };

  const columns = [
    { field: 'customer_name', headerName: 'Name', width: 250, headerClassName: 'grid-header' },
    { field: 'cf_batch_name', headerName: 'Batch', width: 120, headerClassName: 'grid-header' },
    { field: 'email', headerName: 'Email', width: 240, headerClassName: 'grid-header' },
    {
      field: 'actions',
      headerName: 'Send',
      width: 150,
      headerClassName: 'grid-header',
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Button
          variant="contained"
          size="small"
          onClick={() => sendReminderToStudent(params.row)}
          disabled={sendingTo.has(params.row.id) || sending}
          startIcon={sendingTo.has(params.row.id) ? <CircularProgress size={16} /> : <SendIcon />}
          sx={{
            borderRadius: '16px',
            textTransform: 'none',
            fontWeight: 600,
            padding: '10px 28px',
            background: 'linear-gradient(45deg, #5A67D8 0%, #818CF8 100%)',
            color: 'white',
            boxShadow: '0 2px 4px 1px rgba(90, 103, 216, .25)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'scale(1.05)',
              boxShadow: '0 4px 8px 3px rgba(90, 103, 216, .3)',
            },
            '&:disabled': {
              background: '#e0e0e0',
              color: '#a0a0a0',
              boxShadow: 'none',
            },
          }}
        >
          {sendingTo.has(params.row.id) ? 'Sending...' : 'Send Reminder'}
        </Button>
      )
    }
  ];

  function formatMonthYear(ym) {
    if (!ym) return '';
    const [year, month] = ym.split('-');
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      PaperProps={{
        sx: {
          width: 'auto',
          maxHeight: '95vh',
          borderRadius: '20px',
          background: '#f7f7f7',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
        }
      }}
    >
      <DialogTitle sx={{ p: 3, background: '#fff', borderBottom: '1px solid #e0e0e0', flexShrink: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#333' }}>
            Fee Reminder Emails
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, p: 2, background: '#fff', borderRadius: '12px' }}>
          <FormControl size="small" sx={{ minWidth: 200, background: '#fff', borderRadius: '8px' }}>
            <Select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
              {monthOptions.map(m => (
                <MenuItem key={m} value={m}>{formatMonthYear(m)}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            onClick={sendBulkReminders}
            disabled={sending || loading}
            startIcon={sending ? <CircularProgress size={20} /> : <SendIcon />}
            sx={{
              borderRadius: '16px',
              textTransform: 'none',
              fontWeight: 600,
              padding: '6px 16px',
              background: 'linear-gradient(45deg, #805AD5 30%, #B794F4 90%)', // Subtle Purple
              color: 'white',
              boxShadow: '0 2px 4px 1px rgba(128, 90, 213, .25)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: '0 4px 8px 3px rgba(128, 90, 213, .3)',
              },
              '&:disabled': {
                background: '#e0e0e0',
                color: '#a0a0a0',
                boxShadow: 'none',
              },
            }}
          >
            {sending ? 'Sending All...' : `Send Fee Reminder to All (${unpaidStudents.length})`}
          </Button>
        </Box>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        
        <Box sx={{ height: 600, width: '100%', background: '#fff', borderRadius: '12px', overflow: 'hidden' }}>
          <DataGrid
            rows={unpaidStudents}
            columns={columns}
            loading={loading}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            disableSelectionOnClick
            sx={{
              border: 'none',
              '& .grid-header': {
                backgroundColor: '#fafafa',
                fontWeight: 'bold',
                fontSize: '1rem',
              },
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid #f0f0f0'
              }
            }}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
} 