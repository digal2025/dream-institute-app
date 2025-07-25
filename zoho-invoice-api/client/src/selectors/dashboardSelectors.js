/**
 * dashboardSelectors.js
 * Utility functions to compute KPIs, filtered students, totals, and rows for the dashboard.
 */

/**
 * Returns paid/unpaid counts, totals, and outstanding for the dashboard.
 */
export function getDashboardKPIs({ students, paymentsByMonth, months }) {
  const currentMonth = months[0];
  const lastMonth = months[1]; // Get the second month (last month)
  
  // Current month calculations (for "Paid This Month" KPI)
  const paidCustomerIds = new Set(
    paymentsByMonth.filter(row => (row[currentMonth] || 0) > 0).map(row => row.customer_id)
  );
  const paidCount = students.filter(s => paidCustomerIds.has(s.contact_id)).length;
  const totalPaidThisMonth = paymentsByMonth.reduce((sum, row) => sum + (row[currentMonth] || 0), 0);
  
  // Last month calculations (for "Last Month Payments" KPI)
  const lastMonthPaidCustomerIds = new Set(
    paymentsByMonth.filter(row => (row[lastMonth] || 0) > 0).map(row => row.customer_id)
  );
  const lastMonthPaidCount = students.filter(s => lastMonthPaidCustomerIds.has(s.contact_id)).length;
  const totalPaidLastMonth = paymentsByMonth.reduce((sum, row) => sum + (row[lastMonth] || 0), 0);
  
  // Unpaid count (for reference, but we'll replace the KPI)
  const unpaidCount = students.length - paidCount;
  const totalOutstandingUnpaid = students
    .filter(s => !paidCustomerIds.has(s.contact_id))
    .reduce((sum, s) => sum + (Number(s.outstanding_receivable_amount) || 0), 0);
    
  return { 
    paidCount, 
    unpaidCount, 
    totalPaidThisMonth, 
    totalOutstandingUnpaid,
    lastMonthPaidCount,
    totalPaidLastMonth
  };
}

/**
 * Returns filtered students and payment map for the DataGrid.
 */
export function getFilteredStudents({ students, paymentsByMonth, months, search, invoices }) {
  const paymentMap = {};
  paymentsByMonth.forEach(row => {
    paymentMap[row.customer_id] = row;
  });
  const invoiceMap = {};
  (invoices || []).forEach(inv => {
    // Assume invoice has customer_id or contact_id and amount (or total)
    const cid = inv.customer_id || inv.contact_id;
    if (!cid) return;
    if (!invoiceMap[cid]) invoiceMap[cid] = 0;
    invoiceMap[cid] += Number(inv.total || inv.amount || 0);
  });
  const monthsWithCurrent = months ? [...months] : [];
  const filteredStudents = students.filter(s =>
    (s.customer_name || '').toLowerCase().includes(search.toLowerCase())
  ).map((s, idx) => {
    const paymentRow = paymentMap[s.contact_id] || {};
    const monthPayments = {};
    let totalPaid = 0;
    (monthsWithCurrent || []).forEach(m => {
      monthPayments[`paid_${m}`] = paymentRow[m] || 0;
      totalPaid += paymentRow[m] || 0;
    });
    const invoiceAmount = invoiceMap[s.contact_id] || 0;
    const outstanding = invoiceAmount - totalPaid;
    return {
      ...s,
      ...monthPayments,
      id: s.contact_id || s.customer_id || s._id,
      serial: idx + 1,
      outstanding_receivable_amount: outstanding > 0 ? outstanding : 0,
    };
  });
  return { filteredStudents, paymentMap, monthsWithCurrent };
}

/**
 * Returns payment totals for filtered students.
 */
export function getPaymentTotals({ filteredStudents, paymentsByMonth, monthsWithCurrent }) {
  const paymentTotals = {};
  const filteredStudentIds = new Set(filteredStudents.map(s => s.contact_id || s.customer_id));
  const filteredPayments = paymentsByMonth.filter(row => filteredStudentIds.has(row.customer_id));
  monthsWithCurrent.forEach(m => {
    paymentTotals[`paid_${m}`] = filteredPayments.reduce((sum, row) => sum + (row[m] || 0), 0);
  });
  return paymentTotals;
}

/**
 * Returns the total row for the DataGrid.
 */
export function getTotalRow({ filteredStudents, paymentTotals, monthsWithCurrent }) {
  const totalOutstanding = filteredStudents.reduce((sum, s) => {
    const val = Number(s.outstanding_receivable_amount);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);
  return {
    id: 'total-row',
    customer_name: 'Total',
    cf_pgdca_course: '',
    cf_batch_name: '',
    outstanding_receivable_amount: totalOutstanding,
    serial: '',
    ...Object.fromEntries((monthsWithCurrent || []).map(m => [`paid_${m}`, paymentTotals[`paid_${m}`]])),
  };
} 