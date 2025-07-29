require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

// Initialize MongoDB connection
async function connectToMongoDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

// Import routes
const authRouter = require('./backend/routes/auth');
const mongoCustomersRouter = require('./routes/mongoCustomers');
const mongoPaymentsRouter = require('./routes/mongoPayments');
const mongoInvoicesRouter = require('./routes/mongoInvoices');
const notificationsRouter = require('./routes/notifications');
const smsRouter = require('./routes/sms');
const studentRouter = require('./backend/routes/student');
const syncZohoToMongoRouter = require('./backend/routes/syncZohoToMongo');

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client/build')));

// Basic test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/mongo/customers', mongoCustomersRouter);
app.use('/api/mongo/payments', mongoPaymentsRouter);
app.use('/api/mongo/invoices', mongoInvoicesRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/sms', smsRouter);
app.use('/api/student', studentRouter);
app.use('/api', syncZohoToMongoRouter);

// Catch-all for unknown API routes (returns JSON, not HTML)
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

const PORT = process.env.PORT || 3000;

// Start server only after MongoDB connection is established
connectToMongoDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Application available at: http://localhost:${PORT}`);
  });
}).catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
}); 