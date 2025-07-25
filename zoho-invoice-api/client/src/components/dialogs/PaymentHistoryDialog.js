import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton, Box, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, DialogActions } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * PaymentHistoryDialog
 * Dialog to display payment history for a student/customer.
 *
 * Props:
 * - open: boolean
 * - onClose: function
 * - loading: boolean
 * - error: string|null
 * - payments: array
 * - student: object|null
 * - formatDateDMY: function
 */
export default function PaymentHistoryDialog({ open, onClose, loading, error, payments, student, formatDateDMY, onPaymentDeleted, onPaymentUpdated, onNotify }) {
  const [deletingId, setDeletingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [updatingId, setUpdatingId] = useState(null);
  const [updateSuccessId, setUpdateSuccessId] = useState(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const handleDelete = async (paymentId) => {
    setDeletingId(paymentId);
    try {
      const res = await fetch(`/api/mongo/payments/${paymentId}`, { method: 'DELETE' });
      await res.json();
      setDeletingId(null);
      setConfirmDeleteId(null);
      onPaymentDeleted && onPaymentDeleted();
      onNotify && onNotify({ message: `Payment deleted for ${student?.customer_name || 'a student'}.` });
    } catch (err) {
      setDeletingId(null);
      setConfirmDeleteId(null);
      alert('Failed to delete payment.');
    }
  };

  const handleEdit = (p) => {
    setEditingId(p._id || p.payment_id);
    setEditValues({
      date: p.date ? p.date.slice(0, 10) : '',
      amount: p.amount,
      payment_mode: p.payment_mode,
      reference_number: p.reference_number || '',
    });
  };

  const handleEditChange = (field, value) => {
    setEditValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdate = async (paymentId) => {
    setUpdatingId(paymentId);
    try {
      const res = await fetch(`/api/mongo/payments/${paymentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editValues),
      });
      await res.json();
      setEditingId(null);
      setUpdatingId(null);
      onPaymentUpdated && onPaymentUpdated();
      setShowUpdateDialog(true);
      setTimeout(() => setShowUpdateDialog(false), 2000);
      onNotify && onNotify({ message: `Payment of ₹${editValues.amount} updated for ${student?.customer_name || 'a student'}.` });
    } catch (err) {
      setUpdatingId(null);
      alert('Failed to update payment.');
    }
  };

  // Print receipt handler
  const handlePrintReceipt = (payment) => {
    const doc = new jsPDF();
    // Add logo at the top center
    const logoImg = 'data:image/png;base64,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';
    doc.addImage(logoImg, 'PNG', 80, 10, 50, 20); // x, y, width, height
    // Header
    doc.setFontSize(22);
    doc.setTextColor('#6366f1');
    doc.text('Payment Receipt', 105, 42, { align: 'center' }); // Increased y for more space
    doc.setFontSize(13);
    doc.setTextColor('#222');
    doc.text(`Date: ${formatDateDMY(payment.date)}`, 14, 50);
    doc.text(`Receipt #: ${payment.payment_id || payment._id || ''}`, 14, 58);
    doc.text(`Student: ${student?.customer_name || ''}`, 14, 66);
    doc.text(`Course: ${student?.cf_pgdca_course || ''}`, 14, 74);
    doc.text(`Batch: ${student?.cf_batch_name || ''}`, 14, 82);
    doc.text(`Phone: ${student?.phone || ''}`, 14, 90);
    // Payment details table (default style)
    autoTable(doc, {
      startY: 100,
      head: [['Description', 'Amount']],
      body: [
        ['Amount', `Rs.${Number(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
        ['Payment Mode', payment.payment_mode],
        ['Reference #', payment.reference_number || '-'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
      bodyStyles: { fontSize: 12 },
      styles: { cellPadding: 3, font: 'helvetica', fontSize: 12 },
      margin: { left: 14, right: 14 },
      tableWidth: 180,
    });
    // After the table, add the received message (wrapped to two lines)
    const amount = Number(payment.amount);
    const amountInWords = numberToWords(amount); // Helper function to be defined
    const course = student?.cf_pgdca_course || '';
    const dateObj = new Date(payment.date);
    const month = dateObj.toLocaleString('en-US', { month: 'long' });
    const year = dateObj.getFullYear();
    doc.setFontSize(13);
    doc.setTextColor('#222');
    const message = `Received Rs. ${amount} (${amountInWords} Rupees only) towards the course ${course} for the month of ${month} ${year}.`;
    const wrappedMessage = doc.splitTextToSize(message, 180);
    doc.text(wrappedMessage, 14, doc.lastAutoTable.finalY + 12);
    // Calculate Y position for the footer based on wrapped message height
    const footerY = doc.lastAutoTable.finalY + 12 + wrappedMessage.length * 7 + 8;
    // Footer
    doc.setFontSize(12);
    doc.setTextColor('#6366f1');
    doc.text('Thank you for your payment!', 105, footerY, { align: 'center' });
    doc.setTextColor('#888');
    doc.text('This is a system-generated receipt.', 105, footerY + 8, { align: 'center' });
    doc.save(`Receipt_${student?.customer_name || 'student'}_${payment.payment_id || payment._id || ''}.pdf`);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
          boxShadow: '0 8px 32px 0 rgba(99,102,241,0.12), 0 1.5px 8px 0 rgba(0,0,0,0.08)',
          p: 0,
          overflow: 'visible',
        }
      }}
    >
      <DialogTitle sx={{ pb: 2, fontWeight: 700, fontSize: 22, background: '#f1f5f9', borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottom: '1.5px solid #e0e7ff', position: 'relative', px: 5, pt: 3 }}>
        Payment History for <span style={{ color: '#6366f1' }}>{student?.customer_name}</span>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 24, top: 18 }}
        >
         
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: { xs: 2, sm: 4, md: 5 }, background: 'none', minHeight: 320, mt: 1.5 }}>
        {loading ? (
          <Box sx={{ p: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
            <CircularProgress size={32} />
          </Box>
        ) : error ? (
          <Box sx={{ color: 'red', p: 5, fontSize: 18 }}>{error}</Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320, width: '100%', height: '100%' }}>
            <TableContainer sx={{ borderRadius: 3, boxShadow: '0 2px 12px #e0e7ff', background: '#fff', minWidth: 400, maxWidth: '100%' }}>
              <Table size="small" sx={{ width: '100%', tableLayout: 'fixed' }}>
                <TableHead>
                  <TableRow sx={{ background: '#f3f4f6' }}>
                    <TableCell sx={{ fontWeight: 700, fontSize: 16, py: 1.5, px: 2 }}>S.No.</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: 16, py: 1.5, px: 2 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: 16, py: 1.5, px: 2 }}>Amount</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: 16, py: 1.5, px: 2 }}>Payment Mode</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: 16, py: 1.5, px: 2 }}>Reference#</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: 16, py: 1.5, px: 2 }}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.length === 0 ? (
                    <TableRow><TableCell colSpan={6} sx={{ textAlign: 'center', py: 3, fontSize: 17 }}>No payments found.</TableCell></TableRow>
                  ) : (
                    <>
                      {payments.map((p, idx) => {
                        const isEditing = editingId === (p._id || p.payment_id);
                        return (
                          <TableRow key={p._id || p.payment_id} sx={{ background: '#f8fafb', '&:nth-of-type(even)': { background: '#f3f4f6' } }}>
                            <TableCell sx={{ py: 1.5, px: 2, fontSize: 16 }}>{idx + 1}</TableCell>
                            <TableCell sx={{ py: 1.5, px: 2, fontSize: 16 }}>
                              {isEditing ? (
                                <TextField
                                  type="date"
                                  size="small"
                                  value={editValues.date}
                                  onChange={e => handleEditChange('date', e.target.value)}
                                  sx={{ minWidth: 120 }}
                                />
                              ) : formatDateDMY(p.date)}
                            </TableCell>
                            <TableCell sx={{ py: 1.5, px: 2, fontSize: 16 }}>
                              {isEditing ? (
                                <TextField
                                  type="number"
                                  size="small"
                                  value={editValues.amount}
                                  onChange={e => handleEditChange('amount', e.target.value)}
                                  sx={{ minWidth: 80 }}
                                />
                              ) : `₹${Number(p.amount).toLocaleString()}`}
                            </TableCell>
                            <TableCell sx={{ py: 1.5, px: 2, fontSize: 16 }}>
                              {isEditing ? (
                                <TextField
                                  size="small"
                                  value={editValues.payment_mode}
                                  onChange={e => handleEditChange('payment_mode', e.target.value)}
                                  sx={{ minWidth: 100 }}
                                />
                              ) : p.payment_mode}
                            </TableCell>
                            <TableCell sx={{ py: 1.5, px: 2, fontSize: 16 }}>
                              {isEditing ? (
                                <TextField
                                  size="small"
                                  value={editValues.reference_number}
                                  onChange={e => handleEditChange('reference_number', e.target.value)}
                                  sx={{ minWidth: 100 }}
                                />
                              ) : p.reference_number}
                            </TableCell>
                            <TableCell sx={{ py: 1.5, px: 2, fontSize: 16, display: 'flex', gap: 1 }}>
                              {isEditing ? (
                                <IconButton color="primary" size="small" onClick={() => handleUpdate(p._id || p.payment_id)} disabled={updatingId === (p._id || p.payment_id)}>
                                  {updatingId === (p._id || p.payment_id) ? <CircularProgress size={18} /> : <CheckIcon />}
                                </IconButton>
                              ) : (
                                <IconButton color="primary" size="small" onClick={() => handleEdit(p)} disabled={editingId !== null}>
                                  <EditIcon />
                                </IconButton>
                              )}
                              <IconButton color="primary" size="small" onClick={() => handlePrintReceipt(p)} title="Print Receipt">
                                <PictureAsPdfIcon />
                              </IconButton>
                              <IconButton color="error" size="small" onClick={() => setConfirmDeleteId(p._id || p.payment_id)} disabled={deletingId === (p._id || p.payment_id) || editingId === (p._id || p.payment_id)}>
                                {deletingId === (p._id || p.payment_id) ? <CircularProgress size={18} /> : <DeleteIcon />}
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {/* Total row */}
                      <TableRow sx={{ background: '#f3f4f6' }}>
                        <TableCell sx={{ fontWeight: 700, fontSize: 16, py: 1.5, px: 2 }}>Total</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: 16, py: 1.5, px: 2 }}>
                          ₹{payments.reduce((sum, p) => sum + Number(p.amount || 0), 0).toLocaleString()}
                        </TableCell>
                        <TableCell colSpan={4} sx={{ py: 1.5, px: 2 }} />
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </DialogContent>
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)} maxWidth="xs" fullWidth
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
            Delete Payment?
          </DialogTitle>
          <Typography variant="body1" sx={{ mt: 2, mb: 3, color: '#991b1b', fontWeight: 500, textAlign: 'center' }}>
            Are you sure you want to delete this payment? <br />This action <b>cannot</b> be undone.
          </Typography>
          <DialogActions sx={{ width: '100%', justifyContent: 'center', gap: 2, pb: 1 }}>
            <Button onClick={() => setConfirmDeleteId(null)} color="inherit" variant="outlined" sx={{ borderRadius: 2, fontWeight: 700, px: 3, py: 1 }}>
              Cancel
            </Button>
            <Button onClick={() => handleDelete(confirmDeleteId)} color="error" variant="contained" autoFocus disabled={deletingId === confirmDeleteId}
              sx={{ borderRadius: 2, fontWeight: 700, px: 3, py: 1, boxShadow: '0 2px 8px #ef4444aa' }}>
              {deletingId === confirmDeleteId ? <CircularProgress size={18} /> : 'Delete'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
      {/* Payment Update Success Dialog */}
      <Dialog open={showUpdateDialog} onClose={() => setShowUpdateDialog(false)} maxWidth="xs" fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: 'linear-gradient(135deg, #f8fafc 0%, #e0ffe6 100%)',
            boxShadow: '0 8px 32px 0 rgba(16,185,129,0.10), 0 1.5px 8px 0 rgba(0,0,0,0.08)',
            p: 0
          }
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 4, pb: 2, px: 3 }}>
          <CheckCircleRoundedIcon sx={{ color: '#22c55e', fontSize: 48, mb: 1 }} />
          <DialogTitle sx={{ fontWeight: 800, fontSize: 22, color: '#22c55e', pb: 0, textAlign: 'center', width: '100%', background: 'none' }}>
            Payment Updated!
          </DialogTitle>
          <Typography variant="body1" sx={{ mt: 2, mb: 3, color: '#166534', fontWeight: 500, textAlign: 'center' }}>
            The payment was updated successfully.
          </Typography>
        </Box>
      </Dialog>
    </Dialog>
  );
} 

// Helper function to convert number to words
function numberToWords(num) {
  const a = [ '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen' ];
  const b = [ '', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety' ];
  if ((num = num.toString()).length > 9) return 'overflow';
  let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return; let str = '';
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + ' crore ' : '';
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + ' lakh ' : '';
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + ' thousand ' : '';
  str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + ' hundred ' : '';
  str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + ' ' : '';
  return str.trim().replace(/ +/g, ' ').replace(/^./, c => c.toUpperCase());
} 