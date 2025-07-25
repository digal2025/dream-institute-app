import React, { useEffect, useState } from 'react';
import { TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination, CircularProgress, Typography } from '@mui/material';

const PaginatedCustomerTable = () => {
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: page + 1, limit, search });
      const res = await fetch(`/api/mongo/customers?${params}`);
      const data = await res.json();
      setCustomers(data.customers || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line
  }, [page, limit, search]);

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Customers (MongoDB)</Typography>
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
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Outstanding</TableCell>
                  <TableCell>Course</TableCell>
                  <TableCell>Batch</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customers.map((c) => (
                  <TableRow key={c._id}>
                    <TableCell>{c.customer_name || c.contact_name}</TableCell>
                    <TableCell>{c.email}</TableCell>
                    <TableCell>{c.phone}</TableCell>
                    <TableCell>{c.outstanding_receivable_amount}</TableCell>
                    <TableCell>{c.cf_pgdca_course}</TableCell>
                    <TableCell>{c.cf_batch_name}</TableCell>
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

export default PaginatedCustomerTable; 