import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Divider } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';

/**
 * StudentFinancialReport
 * Dialog component to display and print comprehensive financial statement for a student
 *
 * Props:
 * - open: boolean
 * - onClose: function
 * - student: object - student details
 * - payments: array - all payments made by student
 * - formatDateDMY: function - date formatting function
 */
export default function StudentFinancialReport({ open, onClose, student, payments, formatDateDMY }) {

  const handlePrint = () => {
    window.print();
  };

  const totalPaid = payments?.reduce((sum, payment) => sum + Number(payment.amount || 0), 0) || 0;
  const currentDate = new Date().toLocaleDateString('en-IN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <>
      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .financial-report-print-area,
          .financial-report-print-area * {
            visibility: visible;
          }
          .financial-report-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          .page-break {
            page-break-before: always;
          }
          @page {
            margin: 1in;
            size: A4;
          }
        }
      `}</style>

      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '90vh',
            background: '#ffffff'
          }
        }}
      >
        {/* Header with print and close buttons - will be hidden in print */}
        <Box className="no-print" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderBottom: '1px solid #e0e0e0' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1976d2' }}>
            Financial Statement
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              sx={{ 
                backgroundColor: '#1976d2',
                '&:hover': { backgroundColor: '#1565c0' },
                borderRadius: 2
              }}
            >
              Print Report
            </Button>
            <IconButton onClick={onClose} sx={{ ml: 1 }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Printable content area */}
        <DialogContent className="financial-report-print-area" sx={{ p: 0 }}>
          <Box sx={{ p: 4, backgroundColor: 'white', minHeight: '500px' }}>
            
            {/* Header for print */}
            <Box sx={{ textAlign: 'center', mb: 4, borderBottom: '2px solid #1976d2', pb: 3 }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 1 }}>
                DREAM INSTITUTE
              </Typography>
              <Typography variant="h6" sx={{ color: '#666', mb: 1 }}>
                Student Financial Statement
              </Typography>
              <Typography variant="body2" sx={{ color: '#888' }}>
                Generated on: {currentDate}
              </Typography>
            </Box>

            {/* Student Information Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#1976d2', borderBottom: '1px solid #e0e0e0', pb: 1 }}>
                STUDENT INFORMATION
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#555' }}>Name:</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>{student?.customer_name || 'N/A'}</Typography>
                  
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#555' }}>Phone:</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>{student?.phone || 'N/A'}</Typography>
                  
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#555' }}>Email:</Typography>
                  <Typography variant="body1">{student?.email || 'N/A'}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#555' }}>Course:</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>{student?.cf_pgdca_course || 'N/A'}</Typography>
                  
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#555' }}>Batch:</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>{student?.cf_batch_name || 'N/A'}</Typography>
                  
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#555' }}>Student ID:</Typography>
                  <Typography variant="body1">{student?.customer_id || student?._id || 'N/A'}</Typography>
                </Box>
              </Box>
            </Box>

            {/* Payment Summary Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#1976d2', borderBottom: '1px solid #e0e0e0', pb: 1 }}>
                PAYMENT SUMMARY
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 3, mb: 3 }}>
                <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#555' }}>Total Payments</Typography>
                  <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                    {payments?.length || 0}
                  </Typography>
                </Paper>
                <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#555' }}>Total Amount Paid</Typography>
                  <Typography variant="h6" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                    ₹{totalPaid.toLocaleString('en-IN')}
                  </Typography>
                </Paper>
                <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#555' }}>Statement Period</Typography>
                  <Typography variant="h6" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                    All Time
                  </Typography>
                </Paper>
              </Box>
            </Box>

            {/* Payment History Table */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#1976d2', borderBottom: '1px solid #e0e0e0', pb: 1 }}>
                PAYMENT HISTORY
              </Typography>
              
              {payments && payments.length > 0 ? (
                <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  <Table size="small" sx={{ minWidth: 650 }}>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableCell sx={{ fontWeight: 'bold', borderBottom: '2px solid #e0e0e0' }}>S.No.</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', borderBottom: '2px solid #e0e0e0' }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', borderBottom: '2px solid #e0e0e0' }}>Amount (₹)</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', borderBottom: '2px solid #e0e0e0' }}>Payment Mode</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', borderBottom: '2px solid #e0e0e0' }}>Reference #</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {payments.map((payment, index) => (
                        <TableRow key={payment._id || payment.payment_id || index} sx={{ '&:nth-of-type(even)': { backgroundColor: '#fafafa' } }}>
                          <TableCell sx={{ borderBottom: '1px solid #e0e0e0' }}>{index + 1}</TableCell>
                          <TableCell sx={{ borderBottom: '1px solid #e0e0e0' }}>
                            {formatDateDMY ? formatDateDMY(payment.date) : new Date(payment.date).toLocaleDateString('en-IN')}
                          </TableCell>
                          <TableCell sx={{ borderBottom: '1px solid #e0e0e0', fontWeight: 'bold' }}>
                            ₹{Number(payment.amount || 0).toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell sx={{ borderBottom: '1px solid #e0e0e0' }}>{payment.payment_mode || 'N/A'}</TableCell>
                          <TableCell sx={{ borderBottom: '1px solid #e0e0e0' }}>{payment.reference_number || '-'}</TableCell>
                        </TableRow>
                      ))}
                      {/* Total Row */}
                      <TableRow sx={{ backgroundColor: '#e3f2fd' }}>
                        <TableCell sx={{ fontWeight: 'bold', borderTop: '2px solid #1976d2', borderBottom: '2px solid #1976d2' }}>TOTAL</TableCell>
                        <TableCell sx={{ borderTop: '2px solid #1976d2', borderBottom: '2px solid #1976d2' }}></TableCell>
                        <TableCell sx={{ fontWeight: 'bold', borderTop: '2px solid #1976d2', borderBottom: '2px solid #1976d2', color: '#1976d2' }}>
                          ₹{totalPaid.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell sx={{ borderTop: '2px solid #1976d2', borderBottom: '2px solid #1976d2' }}></TableCell>
                        <TableCell sx={{ borderTop: '2px solid #1976d2', borderBottom: '2px solid #1976d2' }}></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Paper sx={{ p: 4, textAlign: 'center', border: '1px solid #e0e0e0' }}>
                  <Typography variant="body1" sx={{ color: '#666' }}>
                    No payment records found for this student.
                  </Typography>
                </Paper>
              )}
            </Box>

            {/* Footer */}
            <Box sx={{ mt: 6, pt: 3, borderTop: '1px solid #e0e0e0', textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                This is a computer-generated financial statement.
              </Typography>
              <Typography variant="body2" sx={{ color: '#888' }}>
                For any queries, please contact Dream Institute administration.
              </Typography>
              <Typography variant="body2" sx={{ color: '#888', mt: 2 }}>
                Generated on: {currentDate} | Page 1 of 1
              </Typography>
            </Box>
          </Box>
        </DialogContent>

        {/* Dialog Actions - hidden in print */}
        <DialogActions className="no-print" sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
          <Button onClick={onClose} color="inherit">
            Close
          </Button>
          <Button 
            variant="contained" 
            startIcon={<PrintIcon />} 
            onClick={handlePrint}
            sx={{ backgroundColor: '#1976d2' }}
          >
            Print Report
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}