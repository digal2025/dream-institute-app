require('dotenv').config();
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('ZOHO_CLIENT_ID:', process.env.ZOHO_CLIENT_ID);
console.log('ZOHO_CLIENT_SECRET:', process.env.ZOHO_CLIENT_SECRET);
console.log('ZOHO_ORGANIZATION_ID:', process.env.ZOHO_ORGANIZATION_ID);
console.log('ZOHO_REDIRECT_URI:', process.env.ZOHO_REDIRECT_URI);
console.log('ZOHO_API_BASE:', process.env.ZOHO_API_BASE);
const express = require('express');
const axios = require('axios');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const app = express();
app.set('trust proxy', 1); // Trust first proxy for correct rate limiting and IP detection

// Security HTTP headers
app.use(helmet());

// Logging
app.use(morgan('combined'));

// Rate limiting (100 requests per 15 min per IP)
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// CORS (allow all in dev, restrict in prod)
app.use(cors());

// Body parser
app.use(express.json());

// Data sanitization against NoSQL injection
// app.use(mongoSanitize()); // Temporarily disabled due to compatibility issue

// Data sanitization against XSS
// app.use(xss()); // Temporarily disabled due to compatibility issue

const mongoose = require('mongoose');
const Customer = require('./backend/models/Customer');
const Payment = require('./backend/models/Payment');
const Invoice = require('./backend/models/Invoice');
const SyncLog = require('./backend/models/SyncLog');
const Token = require('./backend/models/Token');
const authRouter = require('./backend/routes/auth');
const notificationsRouter = require('./routes/notifications');

const mongoCustomersRouter = require('./routes/mongoCustomers');
const mongoPaymentsRouter = require('./routes/mongoPayments');
const mongoInvoicesRouter = require('./routes/mongoInvoices');
const smsRouter = require('./routes/sms');
const studentRouter = require('./backend/routes/student'); // Import student router
const syncZohoToMongoRouter = require('./backend/routes/syncZohoToMongo')(() => ({
  accessToken,
  organization_id: process.env.ZOHO_ORGANIZATION_ID
}));

mongoose.connect(process.env.MONGODB_URI);

mongoose.connection.on('connected', () => {
  console.log('MongoDB Atlas connected');
});
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

const PORT = process.env.PORT || 3000;

let accessToken = null;
let refreshToken = null;
let tokenExpiryTimeout = null;

// Load latest token from MongoDB on startup
(async () => {
  try {
    const latest = await Token.findOne().sort({ updatedAt: -1 });
    if (latest) {
      accessToken = latest.accessToken;
      refreshToken = latest.refreshToken;
      // Optionally, you can check expiry and set tokenExpiryTimeout if needed
    }
  } catch (err) {
    console.error('Failed to load token from DB:', err);
  }
})();

// Helper to save token to MongoDB
async function saveTokenToDB(access, refresh, expiryDate) {
  try {
    await Token.findOneAndUpdate(
      {},
      { accessToken: access, refreshToken: refresh, tokenExpiry: expiryDate, updatedAt: new Date() },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error('Failed to save token to DB:', err);
  }
}

// Helper to refresh access token
async function refreshAccessToken() {
  try {
    const res = await axios.post('https://accounts.zoho.in/oauth/v2/token', null, {
      params: {
        refresh_token: refreshToken,
        client_id: process.env.ZOHO_CLIENT_ID,
        client_secret: process.env.ZOHO_CLIENT_SECRET,
        grant_type: 'refresh_token',
      },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    accessToken = res.data.access_token;
    // Schedule next refresh 5 minutes before expiry
    if (tokenExpiryTimeout) clearTimeout(tokenExpiryTimeout);
    const expiresIn = (res.data.expires_in || 3600) - 300; // 5 min before expiry
    tokenExpiryTimeout = setTimeout(refreshAccessToken, expiresIn * 1000);
    // Save to DB
    const expiryDate = new Date(Date.now() + (expiresIn + 300) * 1000); // expiresIn is already minus 5min
    await saveTokenToDB(accessToken, refreshToken, expiryDate);
    console.log('Access token refreshed and saved to DB!');
  } catch (err) {
    console.error('Failed to refresh access token:', err.response?.data || err.message);
  }
}

// Step 1: Redirect user to Zoho OAuth consent page
app.get('/auth/zoho', (req, res) => {
  const authUrl = `https://accounts.zoho.in/oauth/v2/auth?scope=ZohoInvoice.fullaccess.all&client_id=${process.env.ZOHO_CLIENT_ID}&response_type=code&access_type=offline&redirect_uri=${encodeURIComponent(process.env.ZOHO_REDIRECT_URI)}`;
  res.redirect(authUrl);
});

// Step 2: Handle Zoho OAuth callback and exchange code for access token
app.get('/auth/zoho/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('Missing code');
  try {
    const tokenRes = await axios.post('https://accounts.zoho.in/oauth/v2/token', null, {
      params: {
        grant_type: 'authorization_code',
        client_id: process.env.ZOHO_CLIENT_ID,
        client_secret: process.env.ZOHO_CLIENT_SECRET,
        redirect_uri: process.env.ZOHO_REDIRECT_URI,
        code
      },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    accessToken = tokenRes.data.access_token;
    refreshToken = tokenRes.data.refresh_token;
    // Schedule token refresh 5 minutes before expiry
    if (tokenExpiryTimeout) clearTimeout(tokenExpiryTimeout);
    const expiresIn = (tokenRes.data.expires_in || 3600) - 300; // 5 min before expiry
    tokenExpiryTimeout = setTimeout(refreshAccessToken, expiresIn * 1000);
    // Save to DB
    const expiryDate = new Date(Date.now() + (expiresIn + 300) * 1000);
    await saveTokenToDB(accessToken, refreshToken, expiryDate);
    res.json(tokenRes.data);
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

// Fetch customers from Zoho Invoice API
app.get('/api/customers', async (req, res) => {
  if (!accessToken) return res.status(401).json({ error: 'No access token. Authenticate first.' });
  const organization_id = process.env.ZOHO_ORGANIZATION_ID;
  if (!organization_id) return res.status(500).json({ error: 'Organization ID not set in environment.' });
  try {
    const zohoRes = await axios.get(`${process.env.ZOHO_API_BASE}/invoice/v3/customers`, {
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        'X-com-zoho-invoice-organizationid': organization_id
      }
    });
    res.json(zohoRes.data);
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

// Fetch all payments received for the current month from Zoho Invoice API
app.get('/api/payments/received/month', async (req, res) => {
  if (!accessToken) return res.status(401).json({ error: 'No access token. Authenticate first.' });
  const organization_id = process.env.ZOHO_ORGANIZATION_ID;
  if (!organization_id) return res.status(500).json({ error: 'Organization ID not set in environment.' });

  // Calculate first and last day of current month in YYYY-MM-DD
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const from_date = firstDay.toISOString().slice(0, 10);
  const to_date = lastDay.toISOString().slice(0, 10);

  try {
    const zohoRes = await axios.get(`${process.env.ZOHO_API_BASE}/invoice/v3/customerpayments`, {
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        'X-com-zoho-invoice-organizationid': organization_id
      },
      params: {
        date_start: from_date,
        date_end: to_date
      }
    });
    res.json(zohoRes.data);
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

// Fetch payments received for each of the last 12 months from Zoho Invoice API
app.get('/api/payments/received/last12months', async (req, res) => {
  if (!accessToken) return res.status(401).json({ error: 'No access token. Authenticate first.' });
  const organization_id = process.env.ZOHO_ORGANIZATION_ID;
  if (!organization_id) return res.status(500).json({ error: 'Organization ID not set in environment.' });

  // Helper to get YYYY-MM label
  function getMonthLabel(date) {
    return date.toISOString().slice(0, 7); // e.g., '2024-03'
  }

  // Always use the current date at request time
  const now = new Date();
  console.log('Backend now:', now.toString(), '| ISO:', now.toISOString(), '| Month:', now.getMonth() + 1, '| Year:', now.getFullYear());
  const months = [];
  let year = now.getFullYear();
  let month = now.getMonth(); // 0-based, so July is 6
  for (let i = 0; i < 12; i++) {
    const d = new Date(year, month, 1); // This is the current month for i=0
    const label = getMonthLabel(d);
    months.push({
      label,
      from: new Date(d.getFullYear(), d.getMonth(), 1),
      to: new Date(d.getFullYear(), d.getMonth() + 1, 0) // last day of the month
    });
    // Move to previous month
    month--;
    if (month < 0) {
      month = 11;
      year--;
    }
  }

  // No sorting or reordering needed; months[0] is always the current month

  // Fetch payments for each month
  try {
    const allPayments = [];
    for (const m of months) {
      const from_date = m.from.toISOString().slice(0, 10);
      const to_date = m.to.toISOString().slice(0, 10);
      const zohoRes = await axios.get(`${process.env.ZOHO_API_BASE}/invoice/v3/customerpayments`, {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          'X-com-zoho-invoice-organizationid': organization_id
        },
        params: {
          date_start: from_date,
          date_end: to_date
        }
      });
      // Attach month label to each payment
      (zohoRes.data.customerpayments || []).forEach(p => {
        allPayments.push({ ...p, month: m.label });
      });
    }

    // Aggregate payments per customer per month
    const customerMonthMap = {};
    allPayments.forEach(p => {
      if (!customerMonthMap[p.customer_id]) customerMonthMap[p.customer_id] = {};
      if (!customerMonthMap[p.customer_id][p.month]) customerMonthMap[p.customer_id][p.month] = 0;
      customerMonthMap[p.customer_id][p.month] += Number(p.amount || 0);
    });

    // Build response: [{ customer_id, '2024-03': 100, '2024-02': 0, ... }]
    const result = Object.entries(customerMonthMap).map(([customer_id, monthsObj]) => {
      const row = { customer_id };
      months.forEach(m => {
        row[m.label] = monthsObj[m.label] || 0;
      });
      return row;
    });

    res.json({ months: months.map(m => m.label), data: result });
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

// Fetch all payments for a specific customer from Zoho Invoice API, optionally filtered by month
app.get('/api/payments/received/customer/:customer_id', async (req, res) => {
  if (!accessToken) return res.status(401).json({ error: 'No access token. Authenticate first.' });
  const organization_id = process.env.ZOHO_ORGANIZATION_ID;
  if (!organization_id) return res.status(500).json({ error: 'Organization ID not set in environment.' });
  const { customer_id } = req.params;
  const { month } = req.query; // month in YYYY-MM
  try {
    const params = { customer_id };
    if (month) {
      // Get first and last day of the month
      const [year, m] = month.split('-');
      const from_date = new Date(Number(year), Number(m) - 1, 1).toISOString().slice(0, 10);
      const to_date = new Date(Number(year), Number(m), 0).toISOString().slice(0, 10);
      params.date_start = from_date;
      params.date_end = to_date;
    }
    const zohoRes = await axios.get(`${process.env.ZOHO_API_BASE}/invoice/v3/customerpayments`, {
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        'X-com-zoho-invoice-organizationid': organization_id
      },
      params
    });
    res.json(zohoRes.data);
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

// Fetch all invoices for a specific customer from Zoho Invoice API
app.get('/api/invoices/customer/:customer_id', async (req, res) => {
  if (!accessToken) return res.status(401).json({ error: 'No access token. Authenticate first.' });
  const organization_id = process.env.ZOHO_ORGANIZATION_ID;
  if (!organization_id) return res.status(500).json({ error: 'Organization ID not set in environment.' });
  const { customer_id } = req.params;
  try {
    const zohoRes = await axios.get(`${process.env.ZOHO_API_BASE}/invoice/v3/invoices`, {
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        'X-com-zoho-invoice-organizationid': organization_id
      },
      params: {
        customer_id
      }
    });
    res.json(zohoRes.data);
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

// Token status endpoint for UI
app.get('/api/token/status', (req, res) => {
  // If accessToken is set, assume valid (for demo; in production, check expiry)
  res.json({
    valid: !!accessToken,
    last_refreshed: accessToken ? (new Date()).toISOString() : null // You can store actual refresh time if needed
  });
});

// Endpoint to refresh Zoho token and pull fresh data from Zoho, overwriting MongoDB
app.post('/api/refresh-data', async (req, res) => {
  try {
    // 1. Refresh Zoho token
    await refreshAccessToken();
    // 2. Fetch fresh data from Zoho and overwrite MongoDB
    // Fetch customers
    const organization_id = process.env.ZOHO_ORGANIZATION_ID;
    if (!accessToken || !organization_id) throw new Error('Missing Zoho token or organization ID');
    const customersRes = await axios.get(`${process.env.ZOHO_API_BASE}/invoice/v3/customers`, {
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        'X-com-zoho-invoice-organizationid': organization_id
      }
    });
    const customers = customersRes.data.contacts || [];
    await Customer.deleteMany({});
    await Customer.insertMany(customers);
    // Fetch payments (for last 12 months)
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
    // Fetch invoices for all customers
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
    res.json({ success: true, message: 'Data refreshed from Zoho and MongoDB updated.' });
  } catch (err) {
    console.error('Error in /api/refresh-data:', err && err.stack ? err.stack : err);
    if (err.response && err.response.data) {
      console.error('Zoho API error response:', err.response.data);
    }
    res.status(500).json({ error: err.message || err, zoho: err.response && err.response.data ? err.response.data : undefined });
  }
});

app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.originalUrl}`);
  next();
});

app.use('/api/mongo/customers', mongoCustomersRouter);
app.use('/api/mongo/payments', mongoPaymentsRouter);
app.use('/api/mongo/invoices', mongoInvoicesRouter);
app.use('/api/auth', authRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/sms', smsRouter);
app.use('/api/student', studentRouter); // Use student router
app.use('/api', syncZohoToMongoRouter);

// Catch-all for unknown API routes (returns JSON, not HTML)
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 