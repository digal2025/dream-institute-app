import { useState } from 'react';

/**
 * useDashboardHandlers
 * Custom hook to manage dialog and popover state and handlers for the dashboard.
 *
 * Returns: {
 *   dialog state/handlers,
 *   popover state/handlers,
 *   handleOpenDialog, handleCloseDialog,
 *   handlePaymentCellClick, handlePopoverClose, handleOutstandingCellClick
 * }
 */
export default function useDashboardHandlers() {
  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogPayments, setDialogPayments] = useState([]);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialogError, setDialogError] = useState(null);
  const [dialogStudent, setDialogStudent] = useState(null);

  // Popover state
  const [anchorEl, setAnchorEl] = useState(null);
  const [popoverContent, setPopoverContent] = useState({});
  const [popoverLoading, setPopoverLoading] = useState(false);
  const [popoverError, setPopoverError] = useState(null);
  const [popoverOrigin, setPopoverOrigin] = useState({ anchorOrigin: { vertical: 'bottom', horizontal: 'right' }, transformOrigin: { vertical: 'top', horizontal: 'left' } });

  // Dialog handlers
  async function handleOpenDialog(student, monthKey) {
    setDialogStudent(student);
    setOpenDialog(true);
    setDialogLoading(true);
    setDialogError(null);
    try {
      // Fetch all payments for this customer from MongoDB, with a high limit to get all
      const res = await fetch(`/api/mongo/payments?customer_id=${student.contact_id || student.id}&limit=100`);
      const data = await res.json();
      setDialogPayments(data.customerpayments || []);
    } catch (err) {
      setDialogError('Failed to fetch payment history');
    }
    setDialogLoading(false);
  }
  function handleCloseDialog() {
    setOpenDialog(false);
    setDialogPayments([]);
    setDialogStudent(null);
    setDialogError(null);
  }

  // Popover handlers
  async function handlePaymentCellClick(event, row, monthKey) {
    setPopoverLoading(true);
    setPopoverError(null);
    setPopoverContent({
      customer: row.customer_name,
      month: monthKey,
      details: [],
      amount: row[monthKey] || 0,
    });
    setAnchorEl(event.currentTarget);
    const rect = event.currentTarget.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let anchorOrigin = { vertical: 'bottom', horizontal: 'right' };
    let transformOrigin = { vertical: 'top', horizontal: 'left' };
    if (rect.right > vw - 220) { anchorOrigin.horizontal = 'left'; transformOrigin.horizontal = 'right'; }
    if (rect.left < 220) { anchorOrigin.horizontal = 'right'; transformOrigin.horizontal = 'left'; }
    if (rect.bottom > vh - 120) { anchorOrigin.vertical = 'top'; transformOrigin.vertical = 'bottom'; }
    if (rect.top < 120) { anchorOrigin.vertical = 'bottom'; transformOrigin.vertical = 'top'; }
    setPopoverOrigin({ anchorOrigin, transformOrigin });
    try {
      // Extract YYYY-MM from monthKey (e.g., paid_2024-07)
      const baseMonth = monthKey.replace('paid_', '');
      // Fetch payment details for this customer and month from MongoDB
      const res = await fetch(`/api/mongo/payments?customer_id=${row.id}&month=${baseMonth}`);
      const data = await res.json();
      setPopoverContent({
        customer: row.customer_name,
        month: monthKey,
        details: data.customerpayments || [],
        amount: row[monthKey] || 0,
      });
    } catch (err) {
      setPopoverError('Failed to fetch payment details');
    }
    setPopoverLoading(false);
  }
  function handlePopoverClose() {
    setAnchorEl(null);
    setPopoverContent({});
    setPopoverLoading(false);
    setPopoverError(null);
  }
  async function handleOutstandingCellClick(event, row) {
    setPopoverLoading(true);
    setPopoverError(null);
    setPopoverContent({
      customer: row.customer_name,
      outstanding: row.outstanding_receivable_amount,
      paid: null,
      invoiced: null,
      details: null,
      type: 'outstanding',
    });
    setAnchorEl(event.currentTarget);
    const rect = event.currentTarget.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let anchorOrigin = { vertical: 'bottom', horizontal: 'right' };
    let transformOrigin = { vertical: 'top', horizontal: 'left' };
    if (rect.right > vw - 220) { anchorOrigin.horizontal = 'left'; transformOrigin.horizontal = 'right'; }
    if (rect.left < 220) { anchorOrigin.horizontal = 'right'; transformOrigin.horizontal = 'left'; }
    if (rect.bottom > vh - 120) { anchorOrigin.vertical = 'top'; transformOrigin.vertical = 'bottom'; }
    if (rect.top < 120) { anchorOrigin.vertical = 'bottom'; transformOrigin.vertical = 'top'; }
    setPopoverOrigin({ anchorOrigin, transformOrigin });
    try {
      // Fetch all invoices for this customer from MongoDB
      const invRes = await fetch(`/api/mongo/invoices?customer_id=${row.id}&limit=100`);
      const invData = await invRes.json();
      const invoices = invData.invoices || invData.invoice || invData || [];
      const totalInvoiced = Array.isArray(invoices) ? invoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0) : 0;
      // Fetch all payments for this customer from MongoDB
      const payRes = await fetch(`/api/mongo/payments?customer_id=${row.id}&limit=1000`);
      const payData = await payRes.json();
      const payments = payData.customerpayments || payData.payments || payData || [];
      const totalPaid = Array.isArray(payments) ? payments.reduce((sum, p) => sum + Number(p.amount || 0), 0) : 0;
      setPopoverContent({
        customer: row.customer_name,
        outstanding: row.outstanding_receivable_amount,
        paid: totalPaid,
        invoiced: totalInvoiced,
        details: { invoices, payments },
        type: 'outstanding',
      });
    } catch (err) {
      setPopoverError('Failed to fetch payment/invoice details');
    }
    setPopoverLoading(false);
  }

  const popoverOpen = Boolean(anchorEl);

  return {
    // Dialog state/handlers
    openDialog, setOpenDialog, dialogPayments, setDialogPayments, dialogLoading, setDialogLoading, dialogError, setDialogError, dialogStudent, setDialogStudent,
    // Popover state/handlers
    anchorEl, setAnchorEl, popoverContent, setPopoverContent, popoverLoading, setPopoverLoading, popoverError, setPopoverError, popoverOrigin, setPopoverOrigin,
    // Handler functions
    handleOpenDialog, handleCloseDialog, handlePaymentCellClick, handlePopoverClose, handleOutstandingCellClick,
    popoverOpen
  };
} 