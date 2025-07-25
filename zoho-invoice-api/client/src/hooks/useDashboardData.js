import { useState, useEffect } from 'react';

/**
 * useDashboardData
 * Custom hook to fetch and manage dashboard data (students, payments, months, loading, errors).
 *
 * Returns: {
 *   students, setStudents,
 *   paymentsByMonth, setPaymentsByMonth,
 *   months, setMonths,
 *   loading, setLoading,
 *   error, setError,
 *   paymentsLoading, setPaymentsLoading,
 *   paymentsError, setPaymentsError,
 *   checkTokenStatus
 * }
 */
export default function useDashboardData() {
  const [students, setStudents] = useState([]);
  const [paymentsByMonth, setPaymentsByMonth] = useState([]);
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [paymentsError, setPaymentsError] = useState(null);
  const [invoices, setInvoices] = useState([]);

  // Fetch students
  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/mongo/customers?page=1&limit=1000');
      const data = await res.json();
      setStudents(data.customers || []);
    } catch (err) {
      setError('Failed to fetch student data');
    }
    setLoading(false);
  };

  // Fetch payments
  const fetchPayments = async () => {
    setPaymentsLoading(true);
    setPaymentsError(null);
    try {
      const res = await fetch('/api/mongo/payments?page=1&limit=1000');
      const data = await res.json();
      const now = new Date();
      const monthsArr = [];
      let year = now.getFullYear();
      let month = now.getMonth();
      for (let i = 0; i < 12; i++) {
        const d = new Date(year, month, 1);
        monthsArr.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        month--;
        if (month < 0) { month = 11; year--; }
      }
      const customerMonthMap = {};
      (data.customerpayments || []).forEach(p => {
        const paidMonth = p.date ? `${new Date(p.date).getFullYear()}-${String(new Date(p.date).getMonth() + 1).padStart(2, '0')}` : null;
        if (!paidMonth) return;
        if (!customerMonthMap[p.customer_id]) customerMonthMap[p.customer_id] = {};
        if (!customerMonthMap[p.customer_id][paidMonth]) customerMonthMap[p.customer_id][paidMonth] = 0;
        customerMonthMap[p.customer_id][paidMonth] += Number(p.amount || 0);
      });
      const result = Object.entries(customerMonthMap).map(([customer_id, monthsObj]) => {
        const row = { customer_id };
        monthsArr.forEach(m => { row[m] = monthsObj[m] || 0; });
        return row;
      });
      setPaymentsByMonth(result);
      setMonths(monthsArr);
    } catch (err) {
      setPaymentsError('Failed to fetch payment data');
    }
    setPaymentsLoading(false);
  };

  // Fetch invoices
  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/mongo/invoices?page=1&limit=1000');
      const data = await res.json();
      setInvoices(data.invoices || []);
    } catch (err) {
      // Optionally handle error
    }
  };

  // Refetch all data
  const refetchAll = async () => {
    await Promise.all([
      fetchStudents(),
      fetchPayments(),
      fetchInvoices()
    ]);
  };

  // Initial fetches
  useEffect(() => {
    refetchAll();
  }, []);

  // Check token status on mount
  const checkTokenStatus = async (setTokenDialogOpen) => {
    try {
      const res = await fetch('/api/token/status');
      const data = await res.json();
      if (!data.valid && setTokenDialogOpen) {
        setTokenDialogOpen(true);
      }
    } catch (err) {
      // Optionally handle error
    }
  };

  return {
    students, setStudents,
    paymentsByMonth, setPaymentsByMonth,
    months, setMonths,
    loading, setLoading,
    error, setError,
    paymentsLoading, setPaymentsLoading,
    paymentsError, setPaymentsError,
    checkTokenStatus,
    invoices, setInvoices,
    refetchAll
  };
} 