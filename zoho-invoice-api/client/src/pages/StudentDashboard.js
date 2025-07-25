import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import CloseIcon from '@mui/icons-material/Close';

function StudentDashboard() {
  const { studentId } = useParams();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPwdDialog, setShowPwdDialog] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current: '', new: '', confirm: '' });
  const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [profileTab, setProfileTab] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch(`/api/student/dashboard/${studentId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.msg || 'Failed to fetch dashboard data.');
        }

        setDashboardData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [studentId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  const { studentDetails, paymentHistory, kpi } = dashboardData;
  const formatDate = (dateString) => {
    const d = new Date(dateString);
    // Short, single-line date for mobile, longer for desktop
    return (
      <span style={{
        whiteSpace: 'nowrap',
        fontSize: window.innerWidth < 600 ? 14 : 16,
        fontWeight: 500,
        color: '#374151',
        letterSpacing: 0.1,
        display: 'inline-block',
        minWidth: 90,
      }}>
        {window.innerWidth < 600
          ? d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })
          : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
      </span>
    );
  };

  // --- KPI Calculations ---
  const totalCourseFee = kpi?.invoiced || 0;
  const feesPaid = kpi?.paid || 0;
  const remainingFee = kpi?.outstanding || 0;

  // --- KPI Card Style ---
  const kpiCardStyle = {
    background: '#fff',
    borderRadius: 3,
    padding: { xs: '12px 0', sm: '24px 24px 18px 24px' }, // no left/right padding on mobile
    minWidth: { xs: 120, sm: 180 },
    boxShadow: '0 2px 8px #e0e7ff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    height: { xs: 'auto', sm: 100 },
    justifyContent: 'center',
    gap: 0.5,
    width: { xs: '100%', sm: 'auto' },
    mb: { xs: 2, sm: 0 },
    mx: { xs: 0, sm: 0 },
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('studentId');
    window.location.href = '/student/login';
  };

  const handlePwdChange = (e) => {
    setPwdForm({ ...pwdForm, [e.target.name]: e.target.value });
  };
  const handlePwdVisibility = (field) => {
    setShowPwd((prev) => ({ ...prev, [field]: !prev[field] }));
  };
  const handlePwdDialogClose = () => {
    setShowPwdDialog(false);
    setPwdForm({ current: '', new: '', confirm: '' });
    setPwdError('');
    setPwdSuccess('');
    setPwdLoading(false);
  };
  const handlePwdSubmit = async (e) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');
    if (!pwdForm.current || !pwdForm.new || !pwdForm.confirm) {
      setPwdError('All fields are required.');
      return;
    }
    if (pwdForm.new.length < 6) {
      setPwdError('New password must be at least 6 characters.');
      return;
    }
    if (pwdForm.new !== pwdForm.confirm) {
      setPwdError('New passwords do not match.');
      return;
    }
    setPwdLoading(true);
    try {
      // Call backend to change password
      const res = await fetch('/api/student/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: studentDetails.email, currentPassword: pwdForm.current, newPassword: pwdForm.new }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to change password.');
      setPwdSuccess('Password changed successfully!');
      setTimeout(() => handlePwdDialogClose(), 1500);
    } catch (err) {
      setPwdError(err.message);
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', py: 4, px: { xs: 1.5, sm: 0 } }}>
      {/* Logout button top right */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 1, px: { xs: 1, sm: 3 }, gap: 2 }}>
        <IconButton onClick={() => setShowPwdDialog(true)} sx={{ color: '#6366f1', background: '#fff', borderRadius: '50%', boxShadow: '0 2px 8px #e0e7ff', width: 48, height: 48 }}>
          <AccountCircleIcon sx={{ fontSize: 32 }} />
        </IconButton>
      </Box>
      <Dialog open={showPwdDialog} onClose={handlePwdDialogClose} maxWidth="xs" fullWidth>
        <Paper elevation={6} sx={{ borderRadius: 4, p: 0, background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)', boxShadow: '0 8px 32px 0 rgba(99,102,241,0.10)', position: 'relative', px: { xs: 2, sm: 4 }, py: { xs: 2, sm: 3 } }}>
          {/* Close X button */}
          <IconButton onClick={handlePwdDialogClose} sx={{ position: 'absolute', top: 12, right: 12, color: '#6366f1', background: '#fff', borderRadius: '50%', boxShadow: '0 1px 4px #e0e7ff33', zIndex: 2, '&:hover': { background: '#e0e7ff' } }}>
            <CloseIcon sx={{ fontSize: 24 }} />
          </IconButton>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 4, pb: 2 }}>
            <Box sx={{ width: 90, height: 90, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1 0%, #818CF8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px #6366f144', mb: 2 }}>
              <AccountCircleIcon sx={{ fontSize: 60, color: '#fff' }} />
            </Box>
            <Tabs value={profileTab} onChange={(_, v) => setProfileTab(v)} centered sx={{ mb: 2 }}>
              <Tab label="Profile" sx={{ fontWeight: 700, fontSize: 16, minWidth: 120 }} />
              <Tab label="Change Password" sx={{ fontWeight: 700, fontSize: 16, minWidth: 160 }} />
            </Tabs>
            {profileTab === 0 && (
              <Box sx={{ width: '100%', px: 3, py: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#6366f1', mb: 2, textAlign: 'center' }}>Student Details</Typography>
                <Typography sx={{ fontSize: 16, mb: 1 }}><b>Name:</b> {studentDetails.customer_name}</Typography>
                <Typography sx={{ fontSize: 16, mb: 1 }}><b>Email:</b> {studentDetails.email}</Typography>
                <Typography sx={{ fontSize: 16, mb: 1 }}><b>Course:</b> {studentDetails.cf_pgdca_course || 'N/A'}</Typography>
                <Typography sx={{ fontSize: 16, mb: 1 }}><b>Batch:</b> {studentDetails.cf_batch_name || 'N/A'}</Typography>
                <Typography sx={{ fontSize: 16, mb: 3 }}><b>Phone:</b> {studentDetails.phone}</Typography>
                <Button onClick={handleLogout} fullWidth variant="outlined" color="error" sx={{ fontWeight: 700, borderRadius: 2.5, px: 3, py: 1.2, textTransform: 'none', borderColor: '#ef4444', color: '#ef4444', '&:hover': { borderColor: '#dc2626', backgroundColor: '#fef2f2', color: '#dc2626' }, mt: 2 }}>
                  <LogoutIcon sx={{ fontSize: 22, mr: 1 }} /> Logout
                </Button>
              </Box>
            )}
            {profileTab === 1 && (
              <DialogContent sx={{ pt: 0, pb: 1, px: 0, width: '100%' }}>
                <Box component="form" onSubmit={handlePwdSubmit} sx={{ mt: 1, px: 1 }}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="currentPassword"
                    label="Current Password"
                    name="current"
                    type={showPwd.current ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={pwdForm.current}
                    onChange={handlePwdChange}
                    sx={{
                      background: '#fff',
                      borderRadius: 2.5,
                      boxShadow: '0 1px 4px #e0e7ff33',
                      mb: 2,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2.5,
                        fontSize: 16,
                        fontWeight: 500,
                        color: '#222',
                        background: '#fff',
                        '& fieldset': { borderColor: '#e0e7ff' },
                        '&:hover fieldset': { borderColor: '#6366f1' },
                        '&.Mui-focused fieldset': { borderColor: '#6366f1', borderWidth: 2 },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#6366f1',
                      }
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => handlePwdVisibility('current')} edge="end">
                            {showPwd.current ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="newPassword"
                    label="New Password"
                    name="new"
                    type={showPwd.new ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={pwdForm.new}
                    onChange={handlePwdChange}
                    sx={{
                      background: '#fff',
                      borderRadius: 2.5,
                      boxShadow: '0 1px 4px #e0e7ff33',
                      mb: 2,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2.5,
                        fontSize: 16,
                        fontWeight: 500,
                        color: '#222',
                        background: '#fff',
                        '& fieldset': { borderColor: '#e0e7ff' },
                        '&:hover fieldset': { borderColor: '#6366f1' },
                        '&.Mui-focused fieldset': { borderColor: '#6366f1', borderWidth: 2 },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#6366f1',
                      }
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => handlePwdVisibility('new')} edge="end">
                            {showPwd.new ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="confirmPassword"
                    label="Confirm New Password"
                    name="confirm"
                    type={showPwd.confirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={pwdForm.confirm}
                    onChange={handlePwdChange}
                    sx={{
                      background: '#fff',
                      borderRadius: 2.5,
                      boxShadow: '0 1px 4px #e0e7ff33',
                      mb: 2,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2.5,
                        fontSize: 16,
                        fontWeight: 500,
                        color: '#222',
                        background: '#fff',
                        '& fieldset': { borderColor: '#e0e7ff' },
                        '&:hover fieldset': { borderColor: '#6366f1' },
                        '&.Mui-focused fieldset': { borderColor: '#6366f1', borderWidth: 2 },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#6366f1',
                      }
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => handlePwdVisibility('confirm')} edge="end">
                            {showPwd.confirm ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                  {pwdError && <Alert severity="error" sx={{ mb: 2 }}>{pwdError}</Alert>}
                  {pwdSuccess && <Alert severity="success" sx={{ mb: 2 }}>{pwdSuccess}</Alert>}
                  <DialogActions sx={{ px: 0, pb: 2, pt: 1 }}>
                    <Button onClick={handlePwdDialogClose} sx={{ fontWeight: 600, borderRadius: 2.5, px: 3, py: 1, textTransform: 'none' }}>Cancel</Button>
                    <Button type="submit" variant="contained" disabled={pwdLoading} sx={{ fontWeight: 700, borderRadius: 2.5, px: 3, py: 1.2, textTransform: 'none', background: 'linear-gradient(90deg, #6366f1 0%, #818CF8 100%)', color: 'white', boxShadow: '0 4px 15px rgba(102, 126, 234, 0.10)', '&:hover': { background: 'linear-gradient(90deg, #4f46e5 0%, #6366f1 100%)', boxShadow: '0 6px 20px rgba(102, 126, 234, 0.18)' }, '&:disabled': { background: '#e0e7ff', color: '#94a3b8', boxShadow: 'none' } }}>
                      {pwdLoading ? <CircularProgress size={20} /> : 'Change Password'}
                    </Button>
                  </DialogActions>
                </Box>
              </DialogContent>
            )}
          </Box>
        </Paper>
      </Dialog>
      <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 3 } }}>
        <Box sx={{ display: 'flex', gap: { xs: 2, sm: 4 }, mb: 4, flexDirection: { xs: 'column', md: 'row' } }}>
          {/* Student Details - 30% */}
          <Box sx={{ flex: { xs: 'unset', md: '0 0 30%' }, maxWidth: { md: '30%' }, minWidth: 220, mb: { xs: 3, md: 0 } }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: '#222', fontSize: { xs: 22, sm: 28 } }}>
              Hello, {studentDetails.customer_name}
            </Typography>
            <Typography variant="h6" sx={{ mb: 2, fontSize: { xs: 16, sm: 20 } }}>Your Details</Typography>
            <Typography sx={{ fontSize: { xs: 15, sm: 16 } }}><strong>Course:</strong> {studentDetails.cf_pgdca_course || 'N/A'}</Typography>
            <Typography sx={{ fontSize: { xs: 15, sm: 16 } }}><strong>Batch:</strong> {studentDetails.cf_batch_name || 'N/A'}</Typography>
            <Typography sx={{ fontSize: { xs: 15, sm: 16 } }}><strong>Email:</strong> {studentDetails.email}</Typography>
            <Typography sx={{ fontSize: { xs: 15, sm: 16 } }}><strong>Phone:</strong> {studentDetails.phone}</Typography>
          </Box>
          {/* KPI Cards - 70% */}
          <Box sx={{
            flex: { xs: 'unset', md: '0 0 70%' },
            maxWidth: { md: '70%' },
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'flex-start',
            justifyContent: { xs: 'flex-start', md: 'flex-start' },
            gap: { xs: 2, sm: 3 },
            flexWrap: { xs: 'wrap', sm: 'nowrap' },
            px: 0,
            width: '100%',
          }}>
            <Box sx={kpiCardStyle} style={{ color: '#0ea5e9' }}>
              <div style={{ fontSize: 16, fontWeight: 600, textAlign: 'center' }}>Total Course Fee</div>
              <div style={{ fontSize: 28, fontWeight: 800, marginTop: 2, textAlign: 'center', letterSpacing: 1 }}>₹{totalCourseFee.toLocaleString('en-IN')}</div>
            </Box>
            <Box sx={kpiCardStyle} style={{ color: '#10b981' }}>
              <div style={{ fontSize: 16, fontWeight: 600, textAlign: 'center' }}>Fees Paid So Far</div>
              <div style={{ fontSize: 28, fontWeight: 800, marginTop: 2, textAlign: 'center', letterSpacing: 1 }}>₹{feesPaid.toLocaleString('en-IN')}</div>
            </Box>
            <Box sx={kpiCardStyle} style={{ color: '#ef4444' }}>
              <div style={{ fontSize: 16, fontWeight: 600, textAlign: 'center' }}>Remaining Fee</div>
              <div style={{ fontSize: 28, fontWeight: 800, marginTop: 2, textAlign: 'center', letterSpacing: 1 }}>₹{remainingFee.toLocaleString('en-IN')}</div>
            </Box>
          </Box>
        </Box>
        <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', fontSize: { xs: 18, sm: 24 } }}>
          Payment History
        </Typography>
        <TableContainer component={Paper} sx={{ boxShadow: 'none', background: 'transparent', width: '100%', overflowX: 'auto', mt: 2, p: 0 }}>
          <Table sx={{
            borderCollapse: 'collapse',
            background: '#fff', // subtle white background for table
            '& td, & th': {
              border: '1px solid #22222222',
            },
            '& th': {
              background: '#222a36', // subtle dark color for header
              color: '#fff',
              fontWeight: 700,
              fontSize: 16,
              letterSpacing: 0.2,
            },
          }}>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell align="right">Amount (₹)</TableCell>
                <TableCell>Payment Mode</TableCell>
                <TableCell>Reference Number</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paymentHistory.length > 0 ? (
                paymentHistory.map((payment) => (
                  <TableRow key={payment._id}>
                    <TableCell>{formatDate(payment.date)}</TableCell>
                    <TableCell align="right">₹{Number(payment.amount).toLocaleString('en-IN')}</TableCell>
                    <TableCell>{payment.payment_mode}</TableCell>
                    <TableCell>{payment.reference_number || 'N/A'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No payments found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>
    </Box>
  );
}

export default StudentDashboard; 