import React, { useEffect, useState } from 'react';
import { TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination, CircularProgress, Typography } from '@mui/material';

const PaginatedInvoiceTable = () => {
  const [invoices, setInvoices] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: page + 1, limit, search });
      const res = await fetch(`/api/mongo/invoices?${params}`);
      const data = await res.json();
      setInvoices(data.invoices || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
    // eslint-disable-next-line
  }, [page, limit, search]);

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Invoices (MongoDB)</Typography>
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
                  <TableCell>Invoice #</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Balance</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Due</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv._id}>
                    <TableCell>{inv.invoice_number}</TableCell>
                    <TableCell>{inv.customer_name}</TableCell>
                    <TableCell>{inv.status}</TableCell>
                    <TableCell>{inv.total}</TableCell>
                    <TableCell>{inv.balance}</TableCell>
                    <TableCell>{inv.date ? new Date(inv.date).toLocaleDateString() : ''}</TableCell>
                    <TableCell>{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : ''}</TableCell>
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

export default PaginatedInvoiceTable; 