import React, { useEffect, useState } from 'react';
import { TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination, CircularProgress, Typography } from '@mui/material';

const PaginatedPaymentTable = () => {
  const [payments, setPayments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: page + 1, limit, search });
      const res = await fetch(`/api/mongo/payments?${params}`);
      const data = await res.json();
      setPayments(data.customerpayments || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
    // eslint-disable-next-line
  }, [page, limit, search]);

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Payments (MongoDB)</Typography>
      <TextField
        label="Search"
        value={search}
        onChange={e => { setPage(0); setSearch(e.target.value); }}
        variant="outlined"
        size="small"
        sx={{ mb: 2 }}
      />
      {loading ? <CircularProgress /> : error ? <Typography color="error">{error}</Typography> : (
        <>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Payment #</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Mode</TableCell>
                  <TableCell>Reference</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p._id}>
                    <TableCell>{p.payment_number}</TableCell>
                    <TableCell>{p.customer_name}</TableCell>
                    <TableCell>{p.amount}</TableCell>
                    <TableCell>{p.date ? new Date(p.date).toLocaleDateString() : ''}</TableCell>
                    <TableCell>{p.payment_mode}</TableCell>
                    <TableCell>{p.reference_number}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={limit}
            onRowsPerPageChange={e => { setLimit(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[5, 10, 20, 50]}
          />
        </>
      )}
    </Paper>
  );
};

export default PaginatedPaymentTable; 