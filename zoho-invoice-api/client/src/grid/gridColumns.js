/**
 * gridColumns.js
 * Utility to generate DataGrid column definitions for the dashboard.
 *
 * Exports getGridColumns({ monthsWithCurrent, paymentMap, formatMonthLabel })
 * Returns: { baseColumns, monthColumns, styledColumns }
 */

export function getGridColumns({ monthsWithCurrent, paymentMap, formatMonthLabel, handleOpenDialog, handlePaymentCellClick, handleOutstandingCellClick }) {
  const baseColumns = [
    {
      field: 'serial',
      headerName: 'S.No.',
      minWidth: 70,
      maxWidth: 70,
      sortable: false,
      filterable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => params.row.serial,
    },
    { field: 'customer_name', headerName: 'Name', minWidth: 140, pinned: 'left' },
    { field: 'cf_pgdca_course', headerName: 'Course', minWidth: 120 },
    { field: 'cf_batch_name', headerName: 'Batch', minWidth: 120 },
    { field: 'outstanding_receivable_amount', headerName: 'Outstanding', minWidth: 120, type: 'number' },
  ];
  // Reorder months in true chronological order (earliest to latest)
  const monthsSorted = (monthsWithCurrent || []).slice().sort((a, b) => {
    const [aYear, aMonth] = a.split('-').map(Number);
    const [bYear, bMonth] = b.split('-').map(Number);
    // Sort by year, then by month
    if (aYear !== bYear) return aYear - bYear;
    return aMonth - bMonth;
  });
  const monthColumns = monthsSorted.map((m, idx) => {
    const [year, month] = m.split('-');
    const date = new Date(Number(year), Number(month) - 1);
    const monthName = date.toLocaleString('default', { month: 'long' });
    const yearShort = `'${String(year).slice(2)}`;
    return {
      field: `paid_${m}`,
      headerName: `${monthName} ${yearShort}`,
      minWidth: 120,
      type: 'number',
    };
  });
  const styledColumns = [...baseColumns, ...monthColumns].map(col => {
    if (col.field === 'customer_name') {
      return {
        ...col,
        renderCell: (params) => {
          if (params.row.id === 'total-row') {
            return <strong style={{ color: '#6366f1' }}>{params.value}</strong>;
          }
          return (
            <span style={{ color: '#2563eb', cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => handleOpenDialog(params.row, params.colDef.field.startsWith('paid_') ? params.colDef.field : undefined)}>
              {params.value}
            </span>
          );
        }
      };
    }
    if (col.field === 'outstanding_receivable_amount') {
      return {
        ...col,
        renderCell: (params) => {
          if (params.row.id === 'total-row') {
            const value = Number(params.value);
            return value && !isNaN(value)
              ? <strong style={{ color: '#6366f1' }}>{`₹${value.toLocaleString()}`}</strong>
              : '';
          }
          const value = Number(params.value);
          if (!value || isNaN(value)) return '';
          return (
            <span
              style={{ cursor: 'pointer', color: '#f59e42', fontWeight: 600, textDecoration: 'underline' }}
              onClick={(e) => handleOutstandingCellClick(e, params.row)}
            >
              {`₹${value.toLocaleString()}`}
            </span>
          );
        }
      };
    }
    if (col.field.startsWith('paid_')) {
      return {
        ...col,
        renderCell: (params) => {
          if (params.row.id === 'total-row') {
            return <strong style={{ color: '#6366f1' }}>{`₹${(params.value || 0).toLocaleString()}`}</strong>;
          }
          return (
            <span
              style={{ cursor: params.value > 0 ? 'pointer' : 'default', color: params.value > 0 ? '#059669' : undefined, fontWeight: params.value > 0 ? 600 : undefined }}
              onClick={params.value > 0 ? (e) => handlePaymentCellClick(e, params.row, col.field) : undefined}
            >
              {params.value > 0 ? `₹${Number(params.value).toLocaleString()}` : ''}
            </span>
          );
        }
      };
    }
    return {
      ...col,
      renderCell: (params) => {
        if (params.row.id === 'total-row') {
          return <strong style={{ color: '#6366f1' }}>{col.field.startsWith('paid_') ? `₹${(params.value || 0).toLocaleString()}` : params.value}</strong>;
        }
        return params.value;
      }
    };
  });
  return { baseColumns, monthColumns, styledColumns };
} 