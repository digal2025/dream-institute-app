// App.js - Main dashboard for Fee Management (restored from GitHub)
import React, { useState, useEffect, useCallback } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import IconButton from '@mui/material/IconButton';
import SettingsIcon from '@mui/icons-material/Settings';
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
import TokenManager from '../TokenManager';
import AddCustomerDialog from '../components/dialogs/AddCustomerDialog';
import Button from '@mui/material/Button';
import AddPaymentDialog from '../components/dialogs/AddPaymentDialog';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Drawer from '@mui/material/Drawer';
import Badge from '@mui/material/Badge';
import SmsReminderDialog from '../components/SmsReminderDialog';
import Autocomplete from '@mui/material/Autocomplete';
import MuiDialog from '@mui/material/Dialog';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
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
import { useAuth } from '../context/AuthContext';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TokenManagerDialog from '../components/dialogs/TokenManagerDialog';
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

// Helper to format notification date
function formatNotificationDate(date) {
  if (!date) return '';
  const d = new Date(date);
  const day = d.toLocaleString('en-US', { weekday: 'short' });
  const dayNum = d.getDate();
  const nth = (n) => n + (n > 3 && n < 21 ? 'th' : ['th', 'st', 'nd', 'rd', 'th'][Math.min(n % 10, 4)]);
  const month = d.toLocaleString('en-US', { month: 'long' });
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  return `${day} ${nth(dayNum)} ${month}, ${year} at ${hours}:${minutes} ${ampm}`;
}

// Modern Edit Student Dialog
function EditStudentDialog({ open, onClose, students, onStudentUpdated, onNotify }) {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', cf_pgdca_course: '', cf_batch_name: '' });
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
              cf_batch_name: data.customer.cf_batch_name || ''
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
      const response = await fetch(`/api/mongo/customers/${selectedStudent.contact_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: form.name,
          email: form.email,
          phone: form.phone,
          cf_pgdca_course: form.cf_pgdca_course,
          cf_batch_name: form.cf_batch_name
        })
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess('Student updated successfully!');
        onStudentUpdated && onStudentUpdated();
        onNotify && onNotify({ message: `Updated details for ${form.name}.` });
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
    setForm({ name: '', email: '', phone: '', cf_pgdca_course: '', cf_batch_name: '' });
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
        onNotify && onNotify({ message: `Deleted student: ${selectedStudent.customer_name}.` });
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
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 5, pb: 3, justifyContent: 'space-between' }}>
        <Box>
          {selectedStudent && (
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
  // --- High-level state only ---
  const [search, setSearch] = useState('');
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
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

  // Efficient loading overlay state
  const [initialLoad, setInitialLoad] = useState(true);

  // Admin User Management Dialog state
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [adminTab, setAdminTab] = useState(0);
  const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
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
  const paymentTotals = getPaymentTotals({ filteredStudents, paymentsByMonth, monthsWithCurrent });
  const totalRow = getTotalRow({ filteredStudents, paymentTotals, monthsWithCurrent });
  const rowsWithTotal = [...filteredStudents, totalRow];
  const { paidCount, unpaidCount, totalPaidThisMonth, totalOutstandingUnpaid, lastMonthPaidCount, totalPaidLastMonth } = getDashboardKPIs({ students, paymentsByMonth, months });
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

  // Fetch notifications from backend on mount
  useEffect(() => {
    fetch('/api/notifications')
      .then(res => res.json())
      .then(data => {
        setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
        setUnreadCount((Array.isArray(data.notifications) ? data.notifications : []).filter(n => n && !n.read).length);
      });
  }, []);

  // Notification handler
  const { user: currentUser, logout } = useAuth();
  const handleNotify = async (notification) => {
    // Save to backend
    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...notification, time: new Date(), read: false, user: currentUser?.name || currentUser?.username || '' })
    });
    const data = await res.json();
    setNotifications(prev => [data.notification, ...prev]);
    setUnreadCount(c => c + 1);
  };

  // Mark all as read when opening sidebar
  const handleOpenNotifications = async () => {
    // Mark all as read in backend
    await Promise.all(
      notifications.filter(n => n && !n.read).map(n =>
        fetch(`/api/notifications/${n._id}`, { method: 'PATCH' })
      )
    );
    setNotifications(prev => prev.map(n => n ? { ...n, read: true } : n));
    setUnreadCount(0);
    setNotificationsOpen(true);
  };

  // Clear notifications in backend
  const handleClearNotifications = async () => {
    await fetch('/api/notifications', { method: 'DELETE' });
    setNotifications([]);
    setUnreadCount(0);
  };

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

  // Notification pagination state
  const [notificationPage, setNotificationPage] = useState(1);
  const notificationsPerPage = 10;
  const paginatedNotifications = notifications.slice((notificationPage - 1) * notificationsPerPage, notificationPage * notificationsPerPage);

  // Helper to group notifications by day
  function groupNotificationsByDay(notifications) {
    const groups = { Today: [], Yesterday: [], 'Last Week': [], Older: [] };
    const now = new Date();
    const today = now.setHours(0, 0, 0, 0);
    const yesterday = new Date(today - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(today - 7 * 24 * 60 * 60 * 1000);
    notifications.forEach(n => {
      if (!n.time) return;
      const d = new Date(n.time);
      const t = d.setHours(0, 0, 0, 0);
      if (t === today) {
        groups.Today.push(n);
      } else if (t === yesterday.getTime()) {
        groups.Yesterday.push(n);
      } else if (t > lastWeek.getTime()) {
        groups['Last Week'].push(n);
      } else {
        groups.Older.push(n);
      }
    });
    return groups;
  }

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
          password: adminForm.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        setAdminSuccess('Admin user created successfully!');
        handleNotify({ message: `Created new admin user: ${adminForm.name}.` });
        // Reset form
        setAdminForm({ name: '', email: '', password: '', confirmPassword: '' });
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
    setAdminForm({ name: '', email: '', password: '', confirmPassword: '' });
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
        handleNotify({ message: `Deleted admin user: ${userToDelete.name}.` });
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
  const [profileTab, setProfileTab] = useState(0);

  // --- Render ---
  return (
    <div style={{ minHeight: '100vh', width: '100vw', background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)', padding: 20, boxSizing: 'border-box', position: 'relative' }}>
      {initialLoad && (loading || paymentsLoading) && <FullPageLoadingOverlay progress={progress} />}
      {/* KPI Cards Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 32 }}>
          <KpiCard title="Total Students" value={students.length} subtitle={`as of ${new Date().toLocaleDateString()}`} color="#0ea5e9" />
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
          <Badge badgeContent={unreadCount} color="error" overlap="circular" sx={{ '& .MuiBadge-badge': { top: 6, right: 6, fontWeight: 700, fontSize: 13, minWidth: 22, height: 22, borderRadius: '50%', boxShadow: '0 1px 4px #e0e7ff' } }}>
            <IconButton onClick={handleOpenNotifications} title="Notifications">
              <NotificationsIcon sx={{ color: '#6366f1', fontSize: 28 }} />
            </IconButton>
          </Badge>
        </div>
      </div>
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px #e0e7ff', width: '100%', minWidth: 320, boxSizing: 'border-box' }}>
        {/* Search bar and Add/Edit Customer buttons */}
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
          <Button variant="contained" color="info" onClick={() => setAdminDialogOpen(true)} sx={{ fontWeight: 700, borderRadius: 2, fontSize: 16, px: 3, py: 1.2, background: '#06b6d4', '&:hover': { background: '#0891b2' } }}>
            Admin Users
          </Button>
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
        formatDateDMY={formatDateDMY}
        onPaymentDeleted={() => {
          refreshDialogPayments();
          setPaymentUpdatedInDialog(true);
        }}
        onPaymentUpdated={() => {
          refreshDialogPayments();
          setPaymentUpdatedInDialog(true);
        }}
        onNotify={handleNotify}
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
        onNotify={handleNotify} 
      />
      <AddPaymentDialog open={addPaymentDialogOpen} onClose={() => setAddPaymentDialogOpen(false)} onSuccess={refetchAll} onNotify={handleNotify} />
      <SmsReminderDialog open={smsDialogOpen} onClose={() => setSmsDialogOpen(false)} onNotify={handleNotify} />
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
        onStudentUpdated={() => setStudentUpdated(true)} 
        onNotify={handleNotify}
      />
      {/* // Token Manager   */}
      <Dialog open={tokenDialogOpen} onClose={() => setTokenDialogOpen(false)} maxWidth="md" fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
            p: 0
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: 22, color: '#333', background: '#fff', borderTopLeftRadius: 12, borderTopRightRadius: 12, borderBottom: '1px solid #e0e7ff', position: 'relative', px: 4, py: 2, letterSpacing: 0.5 }}>
          Zoho Token Manager
          <IconButton
            aria-label="close"
            onClick={() => setTokenDialogOpen(false)}
            sx={{ position: 'absolute', right: 12, top: 12, zIndex: 2 }}
            size="small"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{
          width: 'fit-content',
          maxWidth: '50vw',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          p: { xs: 4, sm: 6 }
        }}>
          <TokenManager />
        </DialogContent>
      </Dialog>
      {/* Profile Dialog */}
      <Dialog open={profileDialogOpen} onClose={() => setProfileDialogOpen(false)} maxWidth="xs" fullWidth>
        <Paper elevation={6} sx={{ borderRadius: 4, p: 0, background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)', boxShadow: '0 8px 32px 0 rgba(99,102,241,0.10)', position: 'relative', px: { xs: 2, sm: 4 }, py: { xs: 2, sm: 3 } }}>
          <IconButton onClick={() => setProfileDialogOpen(false)} sx={{ position: 'absolute', top: 12, right: 12, color: '#6366f1', background: '#fff', borderRadius: '50%', boxShadow: '0 1px 4px #e0e7ff33', zIndex: 2, '&:hover': { background: '#e0e7ff' } }}>
            <CloseIcon sx={{ fontSize: 24 }} />
          </IconButton>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 4, pb: 2 }}>
            <Box sx={{ width: 90, height: 90, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1 0%, #818CF8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px #6366f144', mb: 2 }}>
              <AccountCircleIcon sx={{ fontSize: 60, color: '#fff' }} />
            </Box>
            <Tabs value={profileTab} onChange={(_, v) => setProfileTab(v)} centered sx={{ mb: 2 }}>
              <Tab label="Profile" sx={{ fontWeight: 700, fontSize: 16, minWidth: 120 }} />
              <Tab label="Zoho Token Manager" sx={{ fontWeight: 700, fontSize: 16, minWidth: 180 }} />
            </Tabs>
            {profileTab === 0 && (
              <Box sx={{ width: '100%', px: 3, py: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#6366f1', mb: 2, textAlign: 'center' }}>User Details</Typography>
                <Typography sx={{ fontSize: 16, mb: 1 }}><b>Name:</b> {currentUser?.name || 'N/A'}</Typography>
                <Typography sx={{ fontSize: 16, mb: 1 }}><b>Email:</b> {currentUser?.email || 'N/A'}</Typography>
                <Button onClick={logout} fullWidth variant="outlined" color="error" sx={{ fontWeight: 700, borderRadius: 2.5, px: 3, py: 1.2, textTransform: 'none', borderColor: '#ef4444', color: '#ef4444', '&:hover': { borderColor: '#dc2626', backgroundColor: '#fef2f2', color: '#dc2626' }, mt: 2 }}>
                  <LogoutIcon sx={{ fontSize: 22, mr: 1 }} /> Logout
                </Button>
              </Box>
            )}
            {profileTab === 1 && (
              <Box sx={{ width: '100%', px: 0, py: 1 }}>
                <TokenManagerDialog inDialog={true} />
              </Box>
            )}
          </Box>
        </Paper>
      </Dialog>
      {/* Notifications Drawer */}
      <Drawer anchor="right" open={notificationsOpen} onClose={() => setNotificationsOpen(false)}
        PaperProps={{ sx: { width: 400, p: 0, background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)', boxShadow: '0 8px 32px 0 rgba(99,102,241,0.12)' } }}>
        <div style={{ padding: 18, borderBottom: '1.5px solid #e0e7ff', fontWeight: 500, fontSize: 18, color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', letterSpacing: 0.1 }}>
          <span>Notifications</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Button onClick={handleClearNotifications} size="small" variant="text" color="error" sx={{ fontWeight: 500, fontSize: 14, px: 0, py: 0, minWidth: 0, textTransform: 'none' }}>
              Clear
            </Button>
            <IconButton onClick={() => setNotificationsOpen(false)}><CloseIcon /></IconButton>
          </div>
        </div>
        <div style={{ padding: 0, overflowY: 'auto', height: '100%' }}>
          {notifications.length === 0 ? (
            <div style={{ color: '#888', fontSize: 16, textAlign: 'center', marginTop: 32 }}>No notifications yet.</div>
          ) : (
            <div style={{ padding: 12 }}>
              {(() => {
                const groups = groupNotificationsByDay(paginatedNotifications.filter(Boolean));
                return Object.entries(groups).map(([group, items]) =>
                  items.length > 0 ? (
                    <div key={group}>
                      <div style={{
                        fontWeight: 700,
                        color: '#3b82f6',
                        fontSize: 14,
                        margin: '18px 0 8px 0',
                        letterSpacing: 0.3,
                        borderBottom: '2px solid #6366f1',
                        width: '100%',
                        padding: '10px 10px 10px 10px',
                        background: 'linear-gradient(90deg, #e0e7ff 0%, #f8fafc 100%)',
                        borderRadius: 3,
                        boxShadow: '0 1px 4px #e0e7ff44',
                      }}>{group}</div>
                      {items.map((n, idx) => (
                        <div key={n._id || idx} style={{
                          marginBottom: 0,
                          background: n.read ? 'transparent' : '#e0e7ff',
                          borderRadius: 6,
                          boxShadow: 'none',
                          padding: '8px 10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 14,
                          borderLeft: 'none',
                          borderBottom: '1.5px solid #e0e7ff',
                          position: 'relative',
                          minHeight: 48
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 500, color: '#222', fontSize: 14, marginBottom: 2, padding: '0 0 0 2px' }}>{n.message}</div>
                            <div style={{ color: '#6366f1', fontSize: 12, paddingLeft: 2 }}>
                              {`Updated on ${formatNotificationDate(n.time)}`} {n.user && `by ${n.user}`}
                            </div>
                          </div>
                          {!n.read && <span style={{ position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 6px #ef4444aa' }} />}
                        </div>
                      ))}
                    </div>
                  ) : null
                );
              })()}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
                <Pagination
                  count={Math.ceil(notifications.length / notificationsPerPage)}
                  page={notificationPage}
                  onChange={(_, page) => setNotificationPage(page)}
                  size="small"
                  color="primary"
                  sx={{ '& .MuiPaginationItem-root': { fontWeight: 500 } }}
                />
              </div>
            </div>
          )}
        </div>
      </Drawer>

      {/* Admin User Management Dialog */}
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
    </div>
  );
}

export default AdminDashboard; 