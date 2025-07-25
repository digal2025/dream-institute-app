const express = require('express');
const router = express.Router();
const axios = require('axios');
const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');

module.exports = (getZohoTokensAndOrg) => {
  router.post('/sync-zoho-to-mongo', async (req, res) => {
    try {
      // Get latest tokens and org id from main app
      const { accessToken, organization_id } = getZohoTokensAndOrg();
      if (!accessToken || !organization_id) throw new Error('Missing Zoho token or organization ID');

      // 1. Customers
      const customersRes = await axios.get(`${process.env.ZOHO_API_BASE}/invoice/v3/customers`, {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          'X-com-zoho-invoice-organizationid': organization_id
        }
      });
      const customers = customersRes.data.contacts || [];
      await Customer.deleteMany({});
      await Customer.insertMany(customers);

      // 2. Invoices
      const allInvoices = [];
      for (const customer of customers) {
        const invoicesRes = await axios.get(`${process.env.ZOHO_API_BASE}/invoice/v3/invoices`, {
          headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
            'X-com-zoho-invoice-organizationid': organization_id
          },
          params: { customer_id: customer.contact_id }
        });
        (invoicesRes.data.invoices || []).forEach(inv => allInvoices.push(inv));
      }
      await Invoice.deleteMany({});
      await Invoice.insertMany(allInvoices);

      // 3. Payments (for last 12 months)
      const now = new Date();
      let year = now.getFullYear();
      let month = now.getMonth();
      const allPayments = [];
      for (let i = 0; i < 12; i++) {
        const from = new Date(year, month, 1).toISOString().slice(0, 10);
        const to = new Date(year, month + 1, 0).toISOString().slice(0, 10);
        const paymentsRes = await axios.get(`${process.env.ZOHO_API_BASE}/invoice/v3/customerpayments`, {
          headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
            'X-com-zoho-invoice-organizationid': organization_id
          },
          params: { date_start: from, date_end: to }
        });
        (paymentsRes.data.customerpayments || []).forEach(p => allPayments.push(p));
        month--;
        if (month < 0) { month = 11; year--; }
      }
      await Payment.deleteMany({});
      await Payment.insertMany(allPayments);

      res.json({ success: true, message: 'MongoDB updated with fresh data from Zoho Invoice API.' });
    } catch (err) {
      console.error('Error in /api/sync-zoho-to-mongo:', err && err.stack ? err.stack : err);
      if (err.response && err.response.data) {
        console.error('Zoho API error response:', err.response.data);
      }
      res.status(500).json({ error: err.message || err, zoho: err.response && err.response.data ? err.response.data : undefined });
    }
  });
  return router;
}; 