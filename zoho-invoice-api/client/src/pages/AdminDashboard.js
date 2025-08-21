// App.js - Main dashboard for Fee Management (restored from GitHub)
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { DataGrid } from '@mui/x-data-grid';
import IconButton from '@mui/material/IconButton';
// import SettingsIcon from '@mui/icons-material/Settings';
import InputAdornment from '@mui/material/InputAdornment';
import ClearIcon from '@mui/icons-material/Clear';
import CustomGridLoadingOverlay from '../components/layout/CustomGridLoadingOverlay';
import FullPageLoadingOverlay from '../components/layout/FullPageLoadingOverlay';
import { formatMonthLabel, formatDateDMY } from '../utils/dateUtils';
import PaymentHistoryDialog from '../components/dialogs/PaymentHistoryDialog';
import OutstandingPopover from '../components/popovers/OutstandingPopover';
import PaymentPopover from '../components/popovers/PaymentPopover';
import KpiCard from '../components/kpi/KpiCard';
import useDashboardData from '../hooks/useDashboardData';
import useDashboardHandlers from '../handlers/useDashboardHandlers';
import { getGridColumns } from '../grid/gridColumns';
import { getDashboardKPIs, getFilteredStudents, getPaymentTotals, getTotalRow } from '../selectors/dashboardSelectors';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import CloseIcon from '@mui/icons-material/Close';

import AddCustomerDialog from '../components/dialogs/AddCustomerDialog';
import Button from '@mui/material/Button';
import AddPaymentDialog from '../components/dialogs/AddPaymentDialog';

import Drawer from '@mui/material/Drawer';
import Badge from '@mui/material/Badge';
import SmsReminderDialog from '../components/SmsReminderDialog';
import Autocomplete from '@mui/material/Autocomplete';
import MuiDialog from '@mui/material/Dialog';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Pagination from '@mui/material/Pagination';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import DialogContentText from '@mui/material/DialogContentText';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

import LogoutIcon from '@mui/icons-material/Logout';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import Grid from '@mui/material/Grid';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import RefreshIcon from '@mui/icons-material/Refresh';
import NotificationsIcon from '@mui/icons-material/Notifications';
import FilterListIcon from '@mui/icons-material/FilterList';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';


// Modern Edit Student Dialog
function EditStudentDialog({ open, onClose, students, onStudentUpdated, currentUserRole, currentUser }) {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', cf_pgdca_course: '', cf_batch_name: '', course_fees: '', status: 'in_progress' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Auto-dismiss success message
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Fetch student data from backend when selected
  useEffect(() => {
    const fetchStudent = async () => {
      if (selectedStudent && selectedStudent.contact_id) {
        try {
          const response = await fetch(`/api/mongo/customers/${selectedStudent.contact_id}`);
          const data = await response.json();
          if (data.customer) {
            setForm({
              name: data.customer.customer_name || '',
              email: data.customer.email || '',
              phone: data.customer.phone || '',
              cf_pgdca_course: data.customer.cf_pgdca_course || '',
              cf_batch_name: data.customer.cf_batch_name || '',
              course_fees: data.customer.course_fees || '',
              status: data.customer.status || 'in_progress'
            });
          }
        } catch (err) {}
      }
    };
    fetchStudent();
    // eslint-disable-next-line
  }, [selectedStudent]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    if (!selectedStudent) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const requestData = {
        customer_name: form.name,
        email: form.email,
        phone: form.phone,
        cf_pgdca_course: form.cf_pgdca_course,
        cf_batch_name: form.cf_batch_name,
        course_fees: form.course_fees ? parseFloat(form.course_fees) : 0,
        status: form.status,
        user: currentUser?.name || currentUser?.email || 'Unknown User'
      };
      
      console.log('Edit Student Request Data:', requestData);
      
      const response = await fetch(`/api/mongo/customers/${selectedStudent.contact_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });
      const data = await response.json();
      console.log('Edit Student Response Data:', data);
      
      if (response.ok) {
        // Check if invoice was created or updated
        const hasInvoice = data.invoice;
        const isInvoiceUpdate = data.message && data.message.includes('invoice updated');
        const successMessage = hasInvoice 
          ? isInvoiceUpdate 
            ? `Updated ${form.name} and updated invoice to ₹${form.course_fees}!`
            : `Updated ${form.name} and created invoice for ₹${form.course_fees}!`
          : `Updated details for ${form.name}.`;
        
        setSuccess(hasInvoice ? (isInvoiceUpdate ? 'Student updated and invoice updated successfully!' : 'Student updated and invoice created successfully!') : 'Student updated successfully!');
        onStudentUpdated && onStudentUpdated();
        // Backend already sends detailed notification, no need for frontend notification
      } else {
        setError(data.error || 'Failed to update student');
      }
    } catch (err) {
      setError('Failed to update student');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedStudent(null);
    setForm({ name: '', email: '', phone: '', cf_pgdca_course: '', cf_batch_name: '', course_fees: '', status: 'in_progress' });
    setError(null);
    setSuccess(null);
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!selectedStudent) return;
    setDeleteLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/mongo/customers/${selectedStudent.contact_id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess('Student deleted successfully!');
        onStudentUpdated && onStudentUpdated();
        // Backend already sends detailed notification, no need for frontend notification
        setShowDeleteConfirm(false);
        // Close dialog after a short delay to show success message
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        setError(data.error || 'Failed to delete student');
      }
    } catch (err) {
      setError('Failed to delete student');
    } finally {
      setDeleteLoading(false);
    }
  };

  const textFieldSx = {
    background: '#fff',
    borderRadius: 2,
    boxShadow: '0 1px 4px #e0e7ff',
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      fontSize: 17,
      fontWeight: 500,
      color: '#222',
      background: '#fff',
      '& fieldset': { borderColor: '#e0e7ff' },
      '&:hover fieldset': { borderColor: '#6366f1' },
      '&.Mui-focused fieldset': { borderColor: '#6366f1', borderWidth: 2 },
    },
  };

  return (
    <>
      <MuiDialog open={open} onClose={handleClose} maxWidth="sm" fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
            boxShadow: '0 8px 32px 0 rgba(99,102,241,0.12), 0 1.5px 8px 0 rgba(0,0,0,0.08)',
            p: 0
          }
        }}
      >
      <DialogTitle sx={{ pb: 1, fontWeight: 700, fontSize: 22, background: '#f1f5f9', borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottom: '1.5px solid #e0e7ff', position: 'relative' }}>
        Edit Student
      </DialogTitle>
      <DialogContent sx={{ p: 5 }}>
        <Autocomplete
          options={students}
          getOptionLabel={option => option.customer_name || ''}
          loading={students.length === 0}
          loadingText="Loading students..."
          value={selectedStudent}
          onChange={(_, value) => setSelectedStudent(value)}
          renderInput={params => (
            <TextField 
              {...params} 
              label="Select Student" 
              variant="outlined" 
              fullWidth 
              margin="normal" 
              InputLabelProps={{ sx: { fontWeight: 400, color: '#6366f1', fontSize: 16 } }}
            />
          )}
          sx={{
            mb: 2,
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
        <TextField label="Name" name="name" value={form.name} onChange={handleChange} fullWidth margin="normal" sx={textFieldSx} />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField label="Email" name="email" value={form.email} onChange={handleChange} fullWidth margin="normal" sx={{ ...textFieldSx, flex: 1 }} />
          <TextField label="Phone" name="phone" value={form.phone} onChange={handleChange} fullWidth margin="normal" sx={{ ...textFieldSx, flex: 1 }} />
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField label="Course" name="cf_pgdca_course" value={form.cf_pgdca_course} onChange={handleChange} fullWidth margin="normal" sx={{ ...textFieldSx, flex: 1 }} />
          <TextField label="Batch" name="cf_batch_name" value={form.cf_batch_name} onChange={handleChange} fullWidth margin="normal" sx={{ ...textFieldSx, flex: 1 }} />
        </Box>
        <TextField
          label="Course Fees (₹)"
          name="course_fees"
          type="number"
          value={form.course_fees}
          onChange={handleChange}
          inputProps={{ 
            min: 0, 
            step: 0.01,
            onKeyPress: e => { if (!/[0-9.]/.test(e.key)) e.preventDefault(); }
          }}
          fullWidth
          margin="normal"
          sx={textFieldSx}
          helperText="Enter course fees to generate an invoice for this student"
        />
        <TextField 
          label="Student Status" 
          name="status" 
          value={form.status} 
          onChange={handleChange} 
          select
          fullWidth 
          margin="normal" 
          sx={textFieldSx}
        >
          <MenuItem value="in_progress">In Progress</MenuItem>
          <MenuItem value="completed">Completed</MenuItem>
          <MenuItem value="dropped">Dropped</MenuItem>
          <MenuItem value="on_hold">On Hold</MenuItem>
        </TextField>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 5, pb: 3, justifyContent: 'space-between' }}>
        <Box>
          {selectedStudent && currentUserRole === 'super_admin' && (
            <Button 
              onClick={() => setShowDeleteConfirm(true)} 
              variant="outlined" 
              color="error"
              disabled={loading}
              sx={{ 
                fontWeight: 600, 
                borderRadius: 3, 
                fontSize: 14, 
                px: 2, 
                py: 1, 
                textTransform: 'none',
                borderColor: '#ef4444',
                color: '#ef4444',
                '&:hover': { 
                  borderColor: '#dc2626', 
                  backgroundColor: '#fef2f2',
                  color: '#dc2626'
                }
              }}
            >
              Delete Student
            </Button>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleUpdate} variant="contained" disabled={loading || !selectedStudent} sx={{ fontWeight: 700, borderRadius: 3, fontSize: 16, px: 3, py: 1.2, textTransform: 'none', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)', '&:hover': { background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)', boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)' }, '&:disabled': { background: '#e0e7ff', color: '#94a3b8', boxShadow: 'none' } }}>
            {loading ? <CircularProgress size={20} /> : 'Update'}
          </Button>
        </Box>
      </DialogActions>
    </MuiDialog>

    {/* Delete Confirmation Dialog */}
    <Dialog
      open={showDeleteConfirm}
      onClose={() => setShowDeleteConfirm(false)}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          background: 'linear-gradient(135deg, #fff5f5 0%, #ffeaea 100%)',
          boxShadow: '0 8px 32px 0 rgba(0,0,0,0.12)',
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 1, 
        fontWeight: 700, 
        fontSize: 20, 
        color: '#dc2626',
        borderBottom: '1px solid #fecaca',
        background: 'transparent'
      }}>
        ⚠️ Confirm Delete
      </DialogTitle>
      <DialogContent sx={{ p: 4, pt: '15px', background: 'transparent' }}>
        <DialogContentText sx={{ fontSize: 16, color: '#374151', mb: 2, pt: '15px' }}>
          Are you sure you want to delete <strong>{selectedStudent?.customer_name}</strong>?
        </DialogContentText>
        <DialogContentText sx={{ fontSize: 14, color: '#6b7280' }}>
          This action cannot be undone. All student data including payment history will be permanently removed.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 4, pb: 3, gap: 2 }}>
        <Button 
          onClick={() => setShowDeleteConfirm(false)} 
          variant="outlined"
          sx={{ 
            fontWeight: 600, 
            borderRadius: 3, 
            px: 3, 
            py: 1.2, 
            textTransform: 'none',
            borderColor: '#d1d5db',
            color: '#374151',
            '&:hover': { 
              borderColor: '#9ca3af', 
              backgroundColor: '#f9fafb'
            }
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleDelete} 
          variant="contained" 
          color="error"
          disabled={deleteLoading}
          sx={{ 
            fontWeight: 700, 
            borderRadius: 3, 
            px: 3, 
            py: 1.2, 
            textTransform: 'none',
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: 'white',
            boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
            '&:hover': { 
              background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
              boxShadow: '0 6px 20px rgba(239, 68, 68, 0.6)'
            },
            '&:disabled': { 
              background: '#fecaca', 
              color: '#fca5a5', 
              boxShadow: 'none' 
            }
          }}
        >
          {deleteLoading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Delete Student'}
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
}

// AdminDashboard (was MainDashboard)
function AdminDashboard() {
  const { user } = useAuth(); // Get current logged-in user
  // --- High-level state only ---
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('in_progress');

  const [progress, setProgress] = useState(0);
  const [targetProgress, setTargetProgress] = useState(0);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [studentAdded, setStudentAdded] = useState(false);
  const [studentUpdated, setStudentUpdated] = useState(false);
  const [paymentUpdatedInDialog, setPaymentUpdatedInDialog] = useState(false);
  const [addPaymentDialogOpen, setAddPaymentDialogOpen] = useState(false);
  const [smsDialogOpen, setSmsDialogOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationPage, setNotificationPage] = useState(1);
  const [notificationFilters, setNotificationFilters] = useState({
    action: 'all',
    dateRange: 'all'
  });
  const [notificationsFullWidth, setNotificationsFullWidth] = useState(false);


  // Efficient loading overlay state
  const [initialLoad, setInitialLoad] = useState(true);

  // Admin User Management Dialog state
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [adminTab, setAdminTab] = useState(0);
  const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'admin' });
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState(null);
  const [adminSuccess, setAdminSuccess] = useState(null);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // --- Dashboard data and state ---
  const {
    students,
    paymentsByMonth,
    months,
    loading,
    error,
    paymentsLoading,
    invoices,
    refetchAll
  } = useDashboardData();

  // --- Dialog and popover handlers ---
  const {
    openDialog, dialogPayments, dialogLoading, dialogError, dialogStudent,
    anchorEl, popoverContent, popoverLoading, popoverError, popoverOrigin, popoverOpen,
    handleOpenDialog, handleCloseDialog, handlePaymentCellClick, handlePopoverClose, handleOutstandingCellClick,
    setDialogPayments, setDialogError
  } = useDashboardHandlers();

  // --- Data processing and selectors ---
  const { filteredStudents, paymentMap, monthsWithCurrent } = getFilteredStudents({ students, paymentsByMonth, months, search, invoices });
  
  // Apply status filter
  const statusFilteredStudents = statusFilter === 'all' 
    ? filteredStudents 
    : filteredStudents.filter(student => student.status === statusFilter);
  const paymentTotals = getPaymentTotals({ filteredStudents: statusFilteredStudents, paymentsByMonth, monthsWithCurrent });
  const totalRow = getTotalRow({ filteredStudents: statusFilteredStudents, paymentTotals, monthsWithCurrent });
  const rowsWithTotal = [...statusFilteredStudents, totalRow];
  const { paidCount, totalPaidThisMonth, lastMonthPaidCount, totalPaidLastMonth } = getDashboardKPIs({ students: statusFilteredStudents, paymentsByMonth, months });
  const { styledColumns } = getGridColumns({
    monthsWithCurrent,
    paymentMap,
    formatMonthLabel,
    handleOpenDialog,
    handlePaymentCellClick,
    handleOutstandingCellClick
  });

  // Progress bar logic (unchanged)
  useEffect(() => {
    if (loading && paymentsLoading) {
      setTargetProgress(0);
    } else if (!loading && paymentsLoading) {
      setTargetProgress(80);
    } else if (!loading && !paymentsLoading) {
      setTargetProgress(100);
    }
  }, [loading, paymentsLoading]);
  useEffect(() => {
    if (progress === targetProgress) return;
    const increment = () => {
      const diff = targetProgress - progress;
      let step = 1;
      if (Math.abs(diff) > 20) step = 2;
      if (Math.abs(diff) > 40) step = 4;
      if (Math.abs(diff) > 60) step = 8;
      if (progress < targetProgress) {
        setProgress(prev => Math.min(prev + step, targetProgress));
      } else if (progress > targetProgress) {
        setProgress(prev => Math.max(prev - step, targetProgress));
      }
    };
    const timer = setInterval(increment, 16);
    return () => clearInterval(timer);
  }, [progress, targetProgress]);

  // Add a function to refresh dialogPayments for the current student
  async function refreshDialogPayments() {
    if (!dialogStudent) return;
    try {
      const res = await fetch(`/api/mongo/payments?customer_id=${dialogStudent.contact_id || dialogStudent.id}&limit=100`);
      const data = await res.json();
      setDialogPayments(data.customerpayments || []);
    } catch (err) {
      setDialogError('Failed to fetch payment history');
    }
  }

  // Efficient loading overlay effect
  useEffect(() => {
    if (initialLoad && !loading && !paymentsLoading) {
      setInitialLoad(false);
    }
  }, [initialLoad, loading, paymentsLoading]);

  const { user: currentUser, logout } = useAuth();

  // Notification functions
  const fetchNotifications = async () => {
    setNotificationsLoading(true);
    try {
      const response = await fetch(`/api/notifications?page=${notificationPage}&limit=20`);
      const data = await response.json();
      if (data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications/unread-count');
      const data = await response.json();
      setUnreadCount(data.count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleOpenNotifications = async () => {
    setNotificationsOpen(true);
    await fetchNotifications();
    await fetchUnreadCount();
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: currentUser?.name })
      });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const handleClearNotifications = async () => {
    try {
      await fetch('/api/notifications', { method: 'DELETE' });
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  // Filter notifications based on current filters
  const filteredNotifications = useMemo(() => {
    let filtered = [...notifications];

    // Filter by action type
    if (notificationFilters.action !== 'all') {
      filtered = filtered.filter(notification => notification.type === notificationFilters.action);
    }

    // Filter by date range
    if (notificationFilters.dateRange !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (notificationFilters.dateRange) {
        case 'today':
          filtered = filtered.filter(notification => {
            const notificationDate = new Date(notification.timestamp);
            return notificationDate >= today;
          });
          break;
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(notification => {
            const notificationDate = new Date(notification.timestamp);
            return notificationDate >= weekAgo;
          });
          break;
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(notification => {
            const notificationDate = new Date(notification.timestamp);
            return notificationDate >= monthAgo;
          });
          break;
        default:
          break;
      }
    }

    return filtered;
  }, [notifications, notificationFilters]);

  const handleFilterChange = (filterType, value) => {
    setNotificationFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    // Reset to first page when filters change
    setNotificationPage(1);
  };

  // Fetch notifications on mount and when page changes
  useEffect(() => {
    fetchUnreadCount();
  }, []);

  useEffect(() => {
    if (notificationsOpen) {
      fetchNotifications();
    }
  }, [notificationPage, notificationsOpen]);

  // Edit Student Dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [allStudents, setAllStudents] = useState([]);
  const fetchAllStudents = useCallback(async () => {
    try {
      // Fetch all students with a very high limit to ensure all are returned
      const response = await fetch('/api/mongo/customers?limit=1000');
      const data = await response.json();
      if (data.customers) setAllStudents(data.customers);
    } catch (err) {}
  }, []);
  useEffect(() => {
    if (editDialogOpen) fetchAllStudents();
  }, [editDialogOpen, fetchAllStudents]);



  // Admin user creation handlers
  const handleAdminFormChange = (e) => {
    const { name, value } = e.target;
    setAdminForm(prev => ({ ...prev, [name]: value }));
    // Clear errors when user starts typing
    if (adminError) setAdminError(null);
    if (adminSuccess) setAdminSuccess(null);
  };

  const handleCreateAdmin = async () => {
    // Validation
    if (!adminForm.name.trim() || !adminForm.email.trim() || !adminForm.password || !adminForm.confirmPassword) {
      setAdminError('All fields are required');
      return;
    }

    if (adminForm.password !== adminForm.confirmPassword) {
      setAdminError('Passwords do not match');
      return;
    }

    if (adminForm.password.length < 6) {
      setAdminError('Password must be at least 6 characters long');
      return;
    }

    setAdminLoading(true);
    setAdminError(null);
    setAdminSuccess(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: adminForm.name.trim(),
          email: adminForm.email.trim(),
          password: adminForm.password,
          role: adminForm.role
        })
      });

      const data = await response.json();

      if (response.ok) {
        setAdminSuccess('Admin user created successfully!');
        // Backend handles notifications automatically
        // Reset form
        setAdminForm({ name: '', email: '', password: '', confirmPassword: '', role: 'admin' });
        // Refresh admin users list
        fetchAdminUsers();
        // Close dialog after a short delay
        setTimeout(() => {
          setAdminDialogOpen(false);
          setAdminSuccess(null);
        }, 2000);
      } else {
        if (data.error === 'Email already registered') {
          setAdminError('This email is already registered. Please check the admin users list.');
          // Refresh admin users list to show the existing user
          fetchAdminUsers();
        } else {
          setAdminError(data.error || 'Failed to create admin user');
        }
      }
    } catch (err) {
      setAdminError('Failed to create admin user. Please try again.');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleCloseAdminDialog = () => {
    setAdminDialogOpen(false);
    setAdminTab(0);
    setAdminForm({ name: '', email: '', password: '', confirmPassword: '', role: 'admin' });
    setAdminError(null);
    setAdminSuccess(null);
  };

  // Fetch admin users when dialog opens
  const fetchAdminUsers = async () => {
    setAdminUsersLoading(true);
    try {
      const response = await fetch('/api/auth/admin-users');
      const data = await response.json();
      if (response.ok) {
        setAdminUsers(data.users || []);
      }
    } catch (err) {
      console.error('Failed to fetch admin users:', err);
    } finally {
      setAdminUsersLoading(false);
    }
  };

  const handleDeleteAdmin = (userId, userName) => {
    setUserToDelete({ id: userId, name: userName });
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteAdmin = async () => {
    if (!userToDelete) return;

    try {
      const response = await fetch(`/api/auth/admin-users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (response.ok) {
        // Backend handles notifications automatically
        // Refresh the admin users list
        fetchAdminUsers();
      } else {
        setAdminError(data.error || 'Failed to delete admin user');
      }
    } catch (err) {
      setAdminError('Failed to delete admin user. Please try again.');
    } finally {
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
    }
  };

  const cancelDeleteAdmin = () => {
    setDeleteConfirmOpen(false);
    setUserToDelete(null);
  };

  // Fetch admin users when dialog opens
  useEffect(() => {
    if (adminDialogOpen) {
      fetchAdminUsers();
    }
  }, [adminDialogOpen]);

  // User state
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  
  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');

  // Password validation function
  const validatePassword = () => {
    const errors = {};
    
    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters long';
    }
    
    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (passwordData.currentPassword === passwordData.newPassword) {
      errors.newPassword = 'New password must be different from current password';
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (!validatePassword()) {
      return;
    }
    
    setPasswordLoading(true);
    setPasswordMessage('');
    
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setPasswordMessage('Password changed successfully!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowPasswordChange(false);
        setTimeout(() => setPasswordMessage(''), 3000);
      } else {
        setPasswordErrors({ currentPassword: data.message || 'Failed to change password' });
      }
    } catch (error) {
      setPasswordErrors({ currentPassword: 'Network error. Please try again.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Reset password form when dialog closes
  const handleProfileDialogClose = () => {
    setProfileDialogOpen(false);
    setShowPasswordChange(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordErrors({});
    setPasswordMessage('');
  };

  // --- Render ---
  return (
    <div style={{ minHeight: '100vh', width: '100vw', background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)', padding: 20, boxSizing: 'border-box', position: 'relative' }}>
      {initialLoad && (loading || paymentsLoading) && <FullPageLoadingOverlay progress={progress} />}
      {/* KPI Cards Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 32 }}>
          <KpiCard title="Total Students" value={students.filter(student => student.status === 'in_progress').length} subtitle={`active students as of ${new Date().toLocaleDateString()}`} color="#0ea5e9" />
          <KpiCard title="Paid This Month" value={paymentsLoading ? 'Loading...' : `₹${totalPaidThisMonth.toLocaleString()}`}
            subtitle={paymentsLoading ? '' : `${paidCount} students paid`}
            color="#6366f1" />
          <KpiCard title="Last Month Payments" value={paymentsLoading ? 'Loading...' : `₹${totalPaidLastMonth.toLocaleString()}`}
            subtitle={paymentsLoading ? '' : `${lastMonthPaidCount} students paid`}
            color="#10b981" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32, justifyContent: 'flex-end', minWidth: 0 }}>
          {/* User greeting and profile icon */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', px: 2 }} onClick={() => setProfileDialogOpen(true)}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#6366f1', fontSize: 16, mr: 0.5 }}>
              {(() => {
                const hour = new Date().getHours();
                if (hour < 12) return `Good morning, ${currentUser?.name || ''}`;
                if (hour < 18) return `Good afternoon, ${currentUser?.name || ''}`;
                return `Good evening, ${currentUser?.name || ''}`;
              })()}
            </Typography>
            <Avatar sx={{ bgcolor: '#6366f1', width: 32, height: 32 }}>
              <AccountCircleIcon sx={{ fontSize: 24 }} />
            </Avatar>
          </Box>
          
          {/* Notification Icon */}
          <Badge badgeContent={unreadCount} color="error" overlap="circular" sx={{ '& .MuiBadge-badge': { top: 6, right: 6, fontWeight: 700, fontSize: 13, minWidth: 22, height: 22, borderRadius: '50%', boxShadow: '0 1px 4px #e0e7ff' } }}>
            <IconButton onClick={handleOpenNotifications} title="Notifications" sx={{ color: '#6366f1', '&:hover': { background: 'rgba(99, 102, 241, 0.1)' } }}>
              <NotificationsIcon sx={{ fontSize: 28 }} />
            </IconButton>
          </Badge>

        </div>
      </div>
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px #e0e7ff', width: '100%', minWidth: 320, boxSizing: 'border-box' }}>
        {/* Search bar, Status filter, and Add/Edit Customer buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <TextField
            variant="outlined"
            placeholder="Search by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            size="medium"
            sx={{
              width: 320,
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
              '& .MuiInputAdornment-root': { cursor: 'pointer' },
            }}
            InputProps={{
              endAdornment: (
                search ? (
                  <InputAdornment position="end">
                    <ClearIcon onClick={() => setSearch('')} sx={{ color: '#888', '&:hover': { color: '#ef4444' } }} />
                  </InputAdornment>
                ) : null
              )
            }}
          />
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel sx={{ fontWeight: 400, color: '#6366f1', fontSize: 16 }}>
              Filter by Status
            </InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Filter by Status"
              sx={{
                borderRadius: 2,
                fontSize: 17,
                fontWeight: 500,
                color: '#222',
                background: '#f8fafc',
                '& fieldset': { borderColor: '#e0e7ff' },
                '&:hover fieldset': { borderColor: '#6366f1' },
                '&.Mui-focused fieldset': { borderColor: '#6366f1', borderWidth: 2 },
                boxShadow: '0 1px 4px #e0e7ff',
              }}
            >
              <MenuItem value="all">All Students</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="dropped">Dropped</MenuItem>
              <MenuItem value="on_hold">On Hold</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" color="primary" onClick={() => setAddDialogOpen(true)} sx={{ fontWeight: 700, borderRadius: 2, fontSize: 16, px: 3, py: 1.2 }}>
            Add Student
          </Button>
          <Button variant="outlined" color="primary" onClick={() => setEditDialogOpen(true)} sx={{ fontWeight: 700, borderRadius: 2, fontSize: 16, px: 3, py: 1.2, ml: 1, background: '#f8fafc', borderColor: '#6366f1', color: '#6366f1', textTransform: 'none', boxShadow: '0 1px 4px #e0e7ff', '&:hover': { background: '#e0e7ff', borderColor: '#6366f1', color: '#222' } }}>
            Edit Student
          </Button>
          <Button variant="contained" color="secondary" onClick={() => setAddPaymentDialogOpen(true)} sx={{ fontWeight: 700, borderRadius: 2, fontSize: 16, px: 3, py: 1.2 }}>
            Add Payment
          </Button>
          <Button variant="contained" color="warning" onClick={() => setSmsDialogOpen(true)} sx={{ fontWeight: 700, borderRadius: 2, fontSize: 16, px: 3, py: 1.2, background: '#f59e42', '&:hover': { background: '#d97706' } }}>
            Fee Reminder
          </Button>
          {user && user.role === 'super_admin' && (
            <Button variant="contained" color="info" onClick={() => setAdminDialogOpen(true)} sx={{ fontWeight: 700, borderRadius: 2, fontSize: 16, px: 3, py: 1.2, background: '#06b6d4', '&:hover': { background: '#0891b2' } }}>
              Admin Users
            </Button>
          )}
          <Button variant="contained" color="success" onClick={refetchAll} sx={{ fontWeight: 700, borderRadius: 2, fontSize: 16, px: 2, py: 1.2, background: '#10b981', '&:hover': { background: '#059669' }, minWidth: 'auto' }}>
            <RefreshIcon sx={{ fontSize: 20 }} />
          </Button>
        </div>
        {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
        <div style={{ width: '100%', height: 500, overflow: 'auto' }}>
          <DataGrid
            rows={rowsWithTotal}
            columns={styledColumns}
            pageSize={8}
            rowsPerPageOptions={[8, 16, 32]}
            disableSelectionOnClick
            autoHeight
            loading={!initialLoad && (loading || paymentsLoading)}
            loadingOverlaySlot={CustomGridLoadingOverlay}
            editable={false}
            sx={{
              '& .MuiDataGrid-columnHeaders': {
                position: 'sticky',
                top: 0,
                zIndex: 100,
                background: '#f1f5f9',
                color: '#222',
                borderBottom: '2px solid #cbd5e1',
                boxShadow: '0 2px 8px 0 rgba(0,0,0,0.06)',
              },
              '& .MuiDataGrid-columnHeader': {
                background: '#f1f5f9',
                color: '#222',
                borderRight: '1px solid #e0e7ff',
                borderBottom: '1px solid #e0e7ff',
              },
              '& .MuiDataGrid-columnHeaderTitle': {
                color: '#222',
                fontWeight: 700,
              },
              '& .MuiDataGrid-row:last-of-type': {
                background: '#f3f4f6',
                fontWeight: 700,
              },
              '& .MuiDataGrid-cell': {
                borderRight: '1px solid #e0e7ff',
                borderBottom: '1px solid #e0e7ff',
              },
              '& .MuiDataGrid-columnHeadersInner': {
                borderBottom: '1px solid #e0e7ff',
              },
            }}
            // grid is now read-only
          />
        </div>
        {/* Popovers */}
        <OutstandingPopover
          open={popoverOpen && popoverContent.type === 'outstanding'}
          anchorEl={anchorEl}
          onClose={handlePopoverClose}
          loading={popoverLoading}
          error={popoverError}
          content={popoverContent}
          origin={popoverOrigin}
        />
        <PaymentPopover
          open={popoverOpen && popoverContent.type !== 'outstanding'}
          anchorEl={anchorEl}
          onClose={handlePopoverClose}
          loading={popoverLoading}
          error={popoverError}
          content={popoverContent}
          origin={popoverOrigin}
          formatMonthLabel={formatMonthLabel}
          formatDateDMY={formatDateDMY}
        />
      </div>
      {/* Payment History Dialog */}
      <PaymentHistoryDialog
        open={openDialog}
        onClose={() => {
          handleCloseDialog();
          if (paymentUpdatedInDialog) {
            refetchAll();
            setPaymentUpdatedInDialog(false);
          }
        }}
        loading={dialogLoading}
        error={dialogError}
        payments={dialogPayments}
        student={dialogStudent}
        currentUser={user}
        formatDateDMY={formatDateDMY}
        onPaymentDeleted={() => {
          refreshDialogPayments();
          setPaymentUpdatedInDialog(true);
          // Add small delay to ensure backend deletion completes
          setTimeout(() => {
            refetchAll(); // Refresh all data to update KPIs immediately
          }, 100);
        }}
        onPaymentUpdated={() => {
          refreshDialogPayments();
          setPaymentUpdatedInDialog(true);
          // Add small delay to ensure backend update completes
          setTimeout(() => {
            refetchAll(); // Refresh all data to update KPIs immediately
          }, 100);
        }}
      />
      {/* Add Customer Dialog */}
      <AddCustomerDialog 
        open={addDialogOpen} 
        onClose={() => {
          setAddDialogOpen(false);
          if (studentAdded) {
            refetchAll();
            setStudentAdded(false);
          }
        }} 
        onSuccess={() => setStudentAdded(true)} 
        currentUser={user}
      />
              <AddPaymentDialog open={addPaymentDialogOpen} onClose={() => setAddPaymentDialogOpen(false)} onSuccess={refetchAll} currentUser={user} />
      <SmsReminderDialog open={smsDialogOpen} onClose={() => setSmsDialogOpen(false)} />
      <EditStudentDialog 
        open={editDialogOpen} 
        onClose={() => {
          setEditDialogOpen(false);
          if (studentUpdated) {
            refetchAll();
            setStudentUpdated(false);
          }
        }} 
        students={allStudents} 
        onStudentUpdated={() => {
          setStudentUpdated(true);
          // Close any open popovers to ensure fresh data
          handlePopoverClose();
          // Refresh all data immediately to update outstanding column
          refetchAll();
        }} 
        currentUserRole={user?.role}
        currentUser={user}
      />

      {/* Profile Dialog */}
      <Dialog open={profileDialogOpen} onClose={handleProfileDialogClose} maxWidth="sm" fullWidth>
        <Paper elevation={6} sx={{ borderRadius: 4, p: 0, background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)', boxShadow: '0 8px 32px 0 rgba(99,102,241,0.10)', position: 'relative', px: { xs: 2, sm: 4 }, py: { xs: 2, sm: 3 } }}>
          <IconButton onClick={handleProfileDialogClose} sx={{ position: 'absolute', top: 12, right: 12, color: '#6366f1', background: '#fff', borderRadius: '50%', boxShadow: '0 1px 4px #e0e7ff33', zIndex: 2, '&:hover': { background: '#e0e7ff' } }}>
            <CloseIcon sx={{ fontSize: 24 }} />
          </IconButton>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 4, pb: 2 }}>
            <Box sx={{ width: 90, height: 90, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1 0%, #818CF8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px #6366f144', mb: 2 }}>
              <AccountCircleIcon sx={{ fontSize: 60, color: '#fff' }} />
            </Box>
            <Box sx={{ width: '100%', px: 3, py: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#6366f1', mb: 2, textAlign: 'center' }}>User Details</Typography>
              <Typography sx={{ fontSize: 16, mb: 1 }}><b>Name:</b> {currentUser?.name || 'N/A'}</Typography>
              <Typography sx={{ fontSize: 16, mb: 2 }}><b>Email:</b> {currentUser?.email || 'N/A'}</Typography>
              
              {/* Password Success Message */}
              {passwordMessage && (
                <Typography sx={{ 
                  fontSize: 14, 
                  color: '#10b981', 
                  textAlign: 'center', 
                  mb: 2, 
                  p: 1, 
                  backgroundColor: '#ecfdf5', 
                  borderRadius: 1,
                  border: '1px solid #d1fae5'
                }}>
                  {passwordMessage}
                </Typography>
              )}
              
              {/* Change Password Section */}
              {!showPasswordChange ? (
                <Button 
                  onClick={() => setShowPasswordChange(true)} 
                  fullWidth 
                  variant="outlined" 
                  sx={{ 
                    fontWeight: 700, 
                    borderRadius: 2.5, 
                    px: 3, 
                    py: 1.2, 
                    textTransform: 'none', 
                    borderColor: '#6366f1', 
                    color: '#6366f1', 
                    mb: 2,
                    '&:hover': { 
                      borderColor: '#4f46e5', 
                      backgroundColor: '#f8fafc', 
                      color: '#4f46e5' 
                    } 
                  }}
                >
                  Change Password
                </Button>
              ) : (
                <Box component="form" onSubmit={handlePasswordChange} sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#6366f1', mb: 2, textAlign: 'center' }}>
                    Change Password
                  </Typography>
                  
                  <TextField
                    fullWidth
                    type="password"
                    label="Current Password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    error={!!passwordErrors.currentPassword}
                    helperText={passwordErrors.currentPassword}
                    sx={{ mb: 2 }}
                    size="small"
                  />
                  
                  <TextField
                    fullWidth
                    type="password"
                    label="New Password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    error={!!passwordErrors.newPassword}
                    helperText={passwordErrors.newPassword}
                    sx={{ mb: 2 }}
                    size="small"
                  />
                  
                  <TextField
                    fullWidth
                    type="password"
                    label="Confirm New Password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    error={!!passwordErrors.confirmPassword}
                    helperText={passwordErrors.confirmPassword}
                    sx={{ mb: 2 }}
                    size="small"
                  />
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={passwordLoading}
                      sx={{ 
                        flex: 1,
                        fontWeight: 600, 
                        borderRadius: 2, 
                        py: 1,
                        textTransform: 'none',
                        background: '#6366f1',
                        '&:hover': { background: '#4f46e5' }
                      }}
                    >
                      {passwordLoading ? 'Changing...' : 'Change Password'}
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outlined"
                      onClick={() => {
                        setShowPasswordChange(false);
                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        setPasswordErrors({});
                      }}
                      sx={{ 
                        flex: 1,
                        fontWeight: 600, 
                        borderRadius: 2, 
                        py: 1,
                        textTransform: 'none',
                        borderColor: '#6b7280',
                        color: '#6b7280',
                        '&:hover': { 
                          borderColor: '#4b5563', 
                          backgroundColor: '#f9fafb', 
                          color: '#4b5563' 
                        }
                      }}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Box>
              )}
              
              <Button onClick={logout} fullWidth variant="outlined" color="error" sx={{ fontWeight: 700, borderRadius: 2.5, px: 3, py: 1.2, textTransform: 'none', borderColor: '#ef4444', color: '#ef4444', '&:hover': { borderColor: '#dc2626', backgroundColor: '#fef2f2', color: '#dc2626' } }}>
                <LogoutIcon sx={{ fontSize: 22, mr: 1 }} /> Logout
              </Button>
            </Box>

          </Box>
        </Paper>
      </Dialog>


      {/* Admin User Management Dialog - Only visible to super_admin */}
      {user && user.role === 'super_admin' && (
        <Dialog open={adminDialogOpen} onClose={handleCloseAdminDialog} maxWidth="md" fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
            boxShadow: '0 8px 32px 0 rgba(99,102,241,0.12), 0 1.5px 8px 0 rgba(0,0,0,0.08)',
            p: 0
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 700, fontSize: 22, background: '#f1f5f9', borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottom: '1.5px solid #e0e7ff', position: 'relative' }}>
          Admin User Management
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Tabs value={adminTab} onChange={(_, v) => setAdminTab(v)} centered sx={{ 
            mb: 0, 
            background: '#fff', 
            borderBottom: '1px solid #e0e7ff',
            '& .MuiTab-root': {
              fontWeight: 700,
              fontSize: 16,
              minWidth: 120,
              color: '#6366f1',
              '&.Mui-selected': {
                color: '#6366f1',
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#6366f1',
              height: 3
            }
          }}>
            <Tab label="Admin Users" />
            <Tab label="Create New Admin" />
          </Tabs>
          
          {adminTab === 0 && (
            <Box sx={{ p: 4, minHeight: 300 }}>
              {adminUsersLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                  <CircularProgress />
                </Box>
              ) : adminUsers.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" sx={{ color: '#6366f1', mb: 1 }}>No Admin Users Found</Typography>
                  <Typography variant="body2" sx={{ color: '#6b7280' }}>Create the first admin user using the "Create New Admin" tab.</Typography>
                </Box>
              ) : (
                <TableContainer sx={{ maxHeight: 400, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ 
                          fontWeight: 700, 
                          fontSize: 16, 
                          color: '#6366f1', 
                          background: '#f8fafc',
                          borderBottom: '2px solid #e0e7ff'
                        }}>
                          Name
                        </TableCell>
                        <TableCell sx={{ 
                          fontWeight: 700, 
                          fontSize: 16, 
                          color: '#6366f1', 
                          background: '#f8fafc',
                          borderBottom: '2px solid #e0e7ff'
                        }}>
                          Email
                        </TableCell>
                        <TableCell sx={{ 
                          fontWeight: 700, 
                          fontSize: 16, 
                          color: '#6366f1', 
                          background: '#f8fafc',
                          borderBottom: '2px solid #e0e7ff'
                        }}>
                          Role
                        </TableCell>
                        <TableCell sx={{ 
                          fontWeight: 700, 
                          fontSize: 16, 
                          color: '#6366f1', 
                          background: '#f8fafc',
                          borderBottom: '2px solid #e0e7ff'
                        }}>
                          Created Date
                        </TableCell>
                        <TableCell sx={{ 
                          fontWeight: 700, 
                          fontSize: 16, 
                          color: '#6366f1', 
                          background: '#f8fafc',
                          borderBottom: '2px solid #e0e7ff',
                          textAlign: 'center'
                        }}>
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {adminUsers.map((user, index) => (
                        <TableRow 
                          key={user._id || index}
                          sx={{ 
                            '&:hover': { 
                              backgroundColor: '#f8fafc',
                              '& .MuiTableCell-root': {
                                borderBottomColor: '#e0e7ff'
                              }
                            }
                          }}
                        >
                          <TableCell sx={{ 
                            fontWeight: 600, 
                            fontSize: 15, 
                            color: '#222',
                            borderBottom: '1px solid #e0e7ff'
                          }}>
                            {user.name}
                          </TableCell>
                          <TableCell sx={{ 
                            fontSize: 14, 
                            color: '#6366f1',
                            fontWeight: 500,
                            borderBottom: '1px solid #e0e7ff'
                          }}>
                            {user.email}
                          </TableCell>
                          <TableCell sx={{ 
                            fontSize: 14, 
                            color: '#f59e0b',
                            fontWeight: 600,
                            borderBottom: '1px solid #e0e7ff',
                            textTransform: 'capitalize'
                          }}>
                            {user.role || 'admin'}
                          </TableCell>
                          <TableCell sx={{ 
                            fontSize: 14, 
                            color: '#6b7280',
                            borderBottom: '1px solid #e0e7ff'
                          }}>
                            {new Date(user.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell sx={{ 
                            textAlign: 'center',
                            borderBottom: '1px solid #e0e7ff'
                          }}>
                            <IconButton
                              onClick={() => handleDeleteAdmin(user._id, user.name)}
                              sx={{
                                color: '#ef4444',
                                '&:hover': {
                                  backgroundColor: '#fef2f2',
                                  color: '#dc2626'
                                }
                              }}
                              title="Delete Admin User"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
          
          {adminTab === 1 && (
            <Box sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#6366f1', mb: 3, textAlign: 'center' }}>
                Create New Admin User
              </Typography>
              
              {/* Name and Email - Side by side */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={6}>
                  <TextField 
                    label="Full Name" 
                    name="name" 
                    value={adminForm.name} 
                    onChange={handleAdminFormChange} 
                    fullWidth 
                    margin="normal" 
                    sx={{
                      background: '#fff',
                      borderRadius: 2,
                      boxShadow: '0 1px 4px #e0e7ff',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        fontSize: 17,
                        fontWeight: 500,
                        color: '#222',
                        background: '#fff',
                        '& fieldset': { borderColor: '#e0e7ff' },
                        '&:hover fieldset': { borderColor: '#6366f1' },
                        '&.Mui-focused fieldset': { borderColor: '#6366f1', borderWidth: 2 },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField 
                    label="Email Address" 
                    name="email" 
                    type="email"
                    value={adminForm.email} 
                    onChange={handleAdminFormChange} 
                    fullWidth 
                    margin="normal" 
                    sx={{
                      background: '#fff',
                      borderRadius: 2,
                      boxShadow: '0 1px 4px #e0e7ff',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        fontSize: 17,
                        fontWeight: 500,
                        color: '#222',
                        background: '#fff',
                        '& fieldset': { borderColor: '#e0e7ff' },
                        '&:hover fieldset': { borderColor: '#6366f1' },
                        '&.Mui-focused fieldset': { borderColor: '#6366f1', borderWidth: 2 },
                      },
                    }}
                  />
                </Grid>
              </Grid>

              {/* Password and Confirm Password - Side by side with real-time validation */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={6}>
                  <TextField 
                    label="Password" 
                    name="password" 
                    type={showPassword ? 'text' : 'password'}
                    value={adminForm.password} 
                    onChange={handleAdminFormChange} 
                    fullWidth 
                    margin="normal" 
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => setShowPassword((show) => !show)}
                            edge="end"
                            sx={{ color: '#6366f1' }}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      background: '#fff',
                      borderRadius: 2,
                      boxShadow: '0 1px 4px #e0e7ff',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        fontSize: 17,
                        fontWeight: 500,
                        color: '#222',
                        background: '#fff',
                        '& fieldset': { borderColor: '#e0e7ff' },
                        '&:hover fieldset': { borderColor: '#6366f1' },
                        '&.Mui-focused fieldset': { borderColor: '#6366f1', borderWidth: 2 },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField 
                    label="Confirm Password" 
                    name="confirmPassword" 
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={adminForm.confirmPassword} 
                    onChange={handleAdminFormChange} 
                    fullWidth 
                    margin="normal" 
                    error={adminForm.confirmPassword && adminForm.password !== adminForm.confirmPassword}
                    helperText={
                      adminForm.confirmPassword && adminForm.password !== adminForm.confirmPassword 
                        ? "Passwords do not match" 
                        : adminForm.confirmPassword && adminForm.password === adminForm.confirmPassword 
                        ? "Passwords match ✓" 
                        : ""
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle confirm password visibility"
                            onClick={() => setShowConfirmPassword((show) => !show)}
                            edge="end"
                            sx={{ 
                              color: adminForm.confirmPassword && adminForm.password !== adminForm.confirmPassword 
                                ? '#ef4444' 
                                : '#6366f1' 
                            }}
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      background: '#fff',
                      borderRadius: 2,
                      boxShadow: '0 1px 4px #e0e7ff',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        fontSize: 17,
                        fontWeight: 500,
                        color: '#222',
                        background: '#fff',
                        '& fieldset': { 
                          borderColor: adminForm.confirmPassword && adminForm.password !== adminForm.confirmPassword 
                            ? '#ef4444' 
                            : adminForm.confirmPassword && adminForm.password === adminForm.confirmPassword 
                            ? '#10b981' 
                            : '#e0e7ff'
                        },
                        '&:hover fieldset': { 
                          borderColor: adminForm.confirmPassword && adminForm.password !== adminForm.confirmPassword 
                            ? '#dc2626' 
                            : '#6366f1'
                        },
                        '&.Mui-focused fieldset': { 
                          borderColor: adminForm.confirmPassword && adminForm.password !== adminForm.confirmPassword 
                            ? '#dc2626' 
                            : '#6366f1', 
                          borderWidth: 2 
                        },
                      },
                      '& .MuiFormHelperText-root': {
                        fontWeight: 500,
                        fontSize: 14,
                        marginTop: 1
                      }
                    }}
                  />
                </Grid>
              </Grid>

              {/* Role Selection - Only visible to super admin */}
              {user && user.email === 'gitudigal@outlook.com' && (
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth margin="normal" sx={{
                      background: '#fff',
                      borderRadius: 2,
                      boxShadow: '0 1px 4px #e0e7ff',
                    }}>
                      <InputLabel sx={{ fontWeight: 400, color: '#6366f1', fontSize: 16 }}>
                        Role
                      </InputLabel>
                      <Select
                        name="role"
                        value={adminForm.role}
                        onChange={handleAdminFormChange}
                        label="Role"
                        sx={{
                          borderRadius: 2,
                          fontSize: 17,
                          fontWeight: 500,
                          color: '#222',
                          background: '#fff',
                          '& fieldset': { borderColor: '#e0e7ff' },
                          '&:hover fieldset': { borderColor: '#6366f1' },
                          '&.Mui-focused fieldset': { borderColor: '#6366f1', borderWidth: 2 },
                        }}
                      >
                        <MenuItem value="admin">Admin</MenuItem>
                        <MenuItem value="super_admin">Super Admin</MenuItem>
                        <MenuItem value="manager">Manager</MenuItem>
                        <MenuItem value="operator">Operator</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ 
                      background: '#f8fafc', 
                      borderRadius: 2, 
                      p: 2, 
                      mt: 2,
                      border: '1px solid #e0e7ff'
                    }}>
                      <Typography variant="body2" sx={{ color: '#6366f1', fontWeight: 600, mb: 1 }}>
                        Role Descriptions:
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#6b7280', display: 'block' }}>
                        • <strong>Admin:</strong> Standard admin access<br/>
                        • <strong>Super Admin:</strong> Full system control<br/>
                        • <strong>Manager:</strong> Limited admin access<br/>
                        • <strong>Operator:</strong> Basic operations only
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              )}

              {adminError && <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{adminError}</Alert>}
              {adminSuccess && <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }}>{adminSuccess}</Alert>}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 3, gap: 2, background: '#f8fafc', borderTop: '1px solid #e0e7ff' }}>
          <Button onClick={handleCloseAdminDialog} variant="outlined" sx={{ 
            fontWeight: 600, 
            borderRadius: 3, 
            px: 3, 
            py: 1.2, 
            textTransform: 'none',
            borderColor: '#6366f1',
            color: '#6366f1',
            '&:hover': {
              borderColor: '#4f46e5',
              backgroundColor: '#e0e7ff'
            }
          }}>
            Close
          </Button>
          {adminTab === 1 && (
            <Button 
              onClick={handleCreateAdmin} 
              variant="contained" 
              disabled={adminLoading} 
              sx={{ 
                fontWeight: 700, 
                borderRadius: 3, 
                fontSize: 16, 
                px: 3, 
                py: 1.2, 
                textTransform: 'none', 
                background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', 
                color: 'white', 
                boxShadow: '0 4px 15px rgba(6, 182, 212, 0.4)', 
                '&:hover': { 
                  background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)', 
                  boxShadow: '0 6px 20px rgba(6, 182, 212, 0.6)' 
                }, 
                '&:disabled': { 
                  background: '#e0e7ff', 
                  color: '#94a3b8', 
                  boxShadow: 'none' 
                } 
              }}
            >
              {adminLoading ? <CircularProgress size={20} /> : 'Create Admin User'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteConfirmOpen} 
        onClose={cancelDeleteAdmin}
        maxWidth="xs" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: 'linear-gradient(135deg, #f8fafc 0%, #fef2f2 100%)',
            boxShadow: '0 8px 32px 0 rgba(239,68,68,0.10), 0 1.5px 8px 0 rgba(0,0,0,0.08)',
            p: 0
          }
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 4, pb: 2, px: 3 }}>
          <WarningAmberRoundedIcon sx={{ color: '#ef4444', fontSize: 48, mb: 1 }} />
          <DialogTitle sx={{ fontWeight: 800, fontSize: 22, color: '#ef4444', pb: 0, textAlign: 'center', width: '100%', background: 'none' }}>
            Delete Admin User?
          </DialogTitle>
          <Typography variant="body1" sx={{ mt: 2, mb: 3, color: '#991b1b', fontWeight: 500, textAlign: 'center' }}>
            Are you sure you want to delete admin user <strong>"{userToDelete?.name}"</strong>? <br />This action <b>cannot</b> be undone.
          </Typography>
          <DialogActions sx={{ width: '100%', justifyContent: 'center', gap: 2, pb: 1 }}>
            <Button onClick={cancelDeleteAdmin} color="inherit" variant="outlined" sx={{ borderRadius: 2, fontWeight: 700, px: 3, py: 1 }}>
              Cancel
            </Button>
            <Button onClick={confirmDeleteAdmin} color="error" variant="contained" autoFocus
              sx={{ borderRadius: 2, fontWeight: 700, px: 3, py: 1, boxShadow: '0 2px 8px #ef4444aa' }}>
              Delete
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Notifications Drawer */}
      <Drawer 
        anchor="right" 
        open={notificationsOpen} 
        onClose={() => setNotificationsOpen(false)}
        PaperProps={{ 
          sx: { 
            width: notificationsFullWidth ? '100vw' : 480, 
            p: 0, 
            background: '#ffffff', 
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15), 0 8px 32px rgba(0, 0, 0, 0.1)',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          } 
        }}
      >
        {/* Header */}
        <div style={{ 
          padding: '24px 24px 16px 24px', 
          borderBottom: '1px solid #e5e7eb', 
          background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
          position: 'sticky',
          top: 0,
          zIndex: 1
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: 16
          }}>
            <div>
              <h3 style={{ 
                margin: 0, 
                fontSize: 20, 
                fontWeight: 700, 
                color: '#1f2937',
                letterSpacing: '-0.025em'
              }}>
                Notifications
              </h3>
              <p style={{ 
                margin: '4px 0 0 0', 
                fontSize: 14, 
                color: '#6b7280',
                fontWeight: 500
              }}>
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconButton 
                onClick={fetchNotifications} 
                disabled={notificationsLoading}
                sx={{ 
                  color: '#6366f1',
                  background: '#f3f4f6',
                  '&:hover': { background: '#e5e7eb' },
                  '&:disabled': { color: '#9ca3af' },
                  width: 36,
                  height: 36
                }}
                title="Refresh notifications"
              >
                <RefreshIcon sx={{ fontSize: 18 }} />
              </IconButton>
              <IconButton 
                onClick={() => setNotificationsFullWidth(!notificationsFullWidth)}
                sx={{ 
                  color: notificationsFullWidth ? '#6366f1' : '#6b7280',
                  background: notificationsFullWidth ? '#e0e7ff' : '#f3f4f6',
                  '&:hover': { 
                    background: notificationsFullWidth ? '#c7d2fe' : '#e5e7eb',
                    color: '#6366f1'
                  },
                  width: 36,
                  height: 36,
                  transition: 'all 0.2s ease'
                }}
                title={notificationsFullWidth ? 'Exit full width' : 'Full width'}
              >
                {notificationsFullWidth ? 
                  <FullscreenExitIcon sx={{ fontSize: 18 }} /> : 
                  <FullscreenIcon sx={{ fontSize: 18 }} />
                }
              </IconButton>
              <IconButton onClick={() => setNotificationsOpen(false)} sx={{ 
                color: '#6b7280',
                '&:hover': { background: '#f3f4f6' },
                width: 36,
                height: 36
              }}>
                <CloseIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <Button 
              onClick={handleMarkAllAsRead} 
              size="small" 
              variant="outlined" 
              sx={{ 
                fontWeight: 600, 
                fontSize: 13, 
                textTransform: 'none',
                borderColor: '#6366f1',
                color: '#6366f1',
                '&:hover': { 
                  borderColor: '#4f46e5',
                  backgroundColor: '#f8fafc'
                },
                px: 2,
                py: 0.5
              }}
            >
              Mark All Read
            </Button>
            <Button 
              onClick={handleClearNotifications} 
              size="small" 
              variant="outlined" 
              color="error"
              sx={{ 
                fontWeight: 600, 
                fontSize: 13, 
                textTransform: 'none',
                '&:hover': { 
                  backgroundColor: '#fef2f2'
                },
                px: 2,
                py: 0.5
              }}
            >
              Clear All
            </Button>
          </div>

          {/* Filters */}
          <div style={{ 
            display: 'flex', 
            gap: 12, 
            alignItems: 'center',
            padding: '12px 0',
            borderTop: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FilterListIcon sx={{ fontSize: 16, color: '#6b7280' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Filters:</span>
            </div>
            
            {/* Action Filter */}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={notificationFilters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                displayEmpty
                sx={{
                  fontSize: 13,
                  fontWeight: 500,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#d1d5db'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#6366f1'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#6366f1'
                  }
                }}
              >
                <MenuItem value="all" sx={{ fontSize: 13 }}>All Actions</MenuItem>
                <MenuItem value="student_add" sx={{ fontSize: 13 }}>Student Added</MenuItem>
                <MenuItem value="student_update" sx={{ fontSize: 13 }}>Student Updated</MenuItem>
                <MenuItem value="student_delete" sx={{ fontSize: 13 }}>Student Deleted</MenuItem>
                <MenuItem value="payment_add" sx={{ fontSize: 13 }}>Payment Added</MenuItem>
                <MenuItem value="payment_update" sx={{ fontSize: 13 }}>Payment Updated</MenuItem>
                <MenuItem value="payment_delete" sx={{ fontSize: 13 }}>Payment Deleted</MenuItem>
              </Select>
            </FormControl>

            {/* Date Filter */}
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <Select
                value={notificationFilters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                displayEmpty
                sx={{
                  fontSize: 13,
                  fontWeight: 500,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#d1d5db'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#6366f1'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#6366f1'
                  }
                }}
              >
                <MenuItem value="all" sx={{ fontSize: 13 }}>All Time</MenuItem>
                <MenuItem value="today" sx={{ fontSize: 13 }}>Today</MenuItem>
                <MenuItem value="week" sx={{ fontSize: 13 }}>This Week</MenuItem>
                <MenuItem value="month" sx={{ fontSize: 13 }}>This Month</MenuItem>
              </Select>
            </FormControl>

            {/* Results Count */}
            <div style={{ 
              fontSize: 12, 
              color: '#6b7280', 
              fontWeight: 500,
              marginLeft: 'auto'
            }}>
              {filteredNotifications.length} of {notifications.length}
            </div>
          </div>
        </div>
        
        {/* Notifications List */}
        <div style={{ 
          padding: 0, 
          overflowY: 'auto', 
          height: 'calc(100vh - 140px)',
          background: '#fafafa'
        }}>
          {notificationsLoading ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '300px',
              gap: 16
            }}>
              <CircularProgress size={48} sx={{ color: '#6366f1' }} />
              <div style={{ color: '#6b7280', fontSize: 16, fontWeight: 500 }}>Loading notifications...</div>
            </div>
                        ) : filteredNotifications.length === 0 ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '300px',
              color: '#9ca3af', 
              fontSize: 16,
              textAlign: 'center'
            }}>
              <div style={{ 
                width: 64, 
                height: 64, 
                borderRadius: '50%', 
                background: '#f3f4f6', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginBottom: 16
              }}>
                <NotificationsIcon sx={{ fontSize: 32, color: '#d1d5db' }} />
              </div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                {notifications.length === 0 ? 'No notifications yet' : 'No matching notifications'}
              </div>
              <div style={{ fontSize: 14 }}>
                {notifications.length === 0 ? 'You\'re all caught up!' : 'Try adjusting your filters'}
              </div>
            </div>
          ) : (
            <div style={{ padding: '16px 0' }}>
              {filteredNotifications.map((notification, index) => (
                <div key={notification._id || index} style={{
                  margin: '0 16px 12px 16px',
                  background: notification.read ? '#ffffff' : '#fef3c7',
                  borderRadius: 12,
                  padding: '16px 20px',
                  border: notification.read ? '1px solid #e5e7eb' : '1px solid #fbbf24',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    transform: 'translateY(-1px)'
                  }
                }}>
                  {/* Unread Indicator */}
                  {!notification.read && (
                    <div style={{ 
                      position: 'absolute', 
                      top: 16, 
                      left: 8, 
                      width: 6, 
                      height: 6, 
                      borderRadius: '50%', 
                      background: '#f59e0b',
                      boxShadow: '0 0 0 2px #fef3c7'
                    }} />
                  )}
                  
                  {/* Notification Content */}
                  <div style={{ 
                    fontWeight: notification.read ? 400 : 600, 
                    color: '#1f2937', 
                    fontSize: 14, 
                    marginBottom: 8,
                    lineHeight: 1.5,
                    paddingLeft: notification.read ? 0 : 12
                  }}>
                    {notification.message}
                    {/* Show changes for update notifications */}
                    {notification.details && notification.details.changes && notification.details.changes.length > 0 && (
                      <div style={{ 
                        marginTop: 8, 
                        fontSize: 12, 
                        color: '#6b7280',
                        fontWeight: 400
                      }}>
                        {notification.details.changes.slice(0, 2).map((change, index) => (
                          <div key={index} style={{ marginBottom: 2 }}>
                            • {change}
                          </div>
                        ))}
                        {notification.details.changes.length > 2 && (
                          <div style={{ color: '#9ca3af', fontSize: 11 }}>
                            +{notification.details.changes.length - 2} more changes
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Footer */}
                  <div style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 12,
                    paddingLeft: notification.read ? 0 : 12
                  }}>
                    <span style={{ 
                      color: '#6b7280', 
                      fontSize: 12, 
                      fontWeight: 500
                    }}>
                      {(() => {
                        try {
                          const date = new Date(notification.timestamp);
                          if (isNaN(date.getTime())) {
                            return 'Just now';
                          }
                          const now = new Date();
                          const diffInMinutes = Math.floor((now - date) / (1000 * 60));
                          
                          if (diffInMinutes < 1) return 'Just now';
                          if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
                          if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
                          if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
                          
                          return date.toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          });
                        } catch (error) {
                          return 'Just now';
                        }
                      })()}
                    </span>
                    <span style={{ 
                      fontSize: 10, 
                      padding: '4px 10px', 
                      borderRadius: 16, 
                      background: (() => {
                        switch (notification.type) {
                          case 'student_add': return '#dcfce7';
                          case 'student_update': return '#dbeafe';
                          case 'student_delete': return '#fee2e2';
                          case 'payment_add': return '#fef3c7';
                          case 'payment_update': return '#ede9fe';
                          case 'payment_delete': return '#fecaca';
                          default: return '#dbeafe';
                        }
                      })(),
                      color: (() => {
                        switch (notification.type) {
                          case 'student_add': return '#166534';
                          case 'student_update': return '#1e40af';
                          case 'student_delete': return '#991b1b';
                          case 'payment_add': return '#92400e';
                          case 'payment_update': return '#5b21b6';
                          case 'payment_delete': return '#991b1b';
                          default: return '#1e40af';
                        }
                      })(),
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5
                    }}>
                      {notification.type.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
              
              {/* Pagination */}
              {filteredNotifications.length > 0 && (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  padding: '24px 16px 16px 16px',
                  borderTop: '1px solid #e5e7eb',
                  background: '#ffffff'
                }}>
                  <Pagination
                    count={Math.ceil(filteredNotifications.length / 20)}
                    page={notificationPage}
                    onChange={(_, page) => setNotificationPage(page)}
                    size="small"
                    color="primary"
                    sx={{ 
                      '& .MuiPaginationItem-root': { 
                        fontWeight: 600,
                        fontSize: 14
                      },
                      '& .Mui-selected': {
                        background: '#6366f1 !important',
                        color: 'white !important'
                      }
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </Drawer>
    </div>
  );
}

export default AdminDashboard; 