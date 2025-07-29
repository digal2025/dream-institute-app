require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

// Add production logging
console.log('🚀 Starting Dream Institute Fee Management App...');
console.log('📋 Environment:', process.env.NODE_ENV || 'development');
console.log('🔌 Port:', process.env.PORT || 3000);
console.log('💾 MongoDB URI available:', !!process.env.MONGODB_URI);

// Initialize MongoDB connection with better error handling
async function connectToMongoDB() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('💡 Check your MONGODB_URI environment variable');
    // Don't exit, let the app start without DB for debugging
    console.log('⚠️  Starting server without MongoDB connection...');
  }
}

// Error handling for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

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

// Health check endpoint for Dokploy
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Dream Institute Fee Management App',
    status: 'Running',
    timestamp: new Date().toISOString()
  });
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

// Start server immediately, connect to MongoDB asynchronously
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Application available at: http://localhost:${PORT}`);
  console.log(`❤️  Health check available at: http://localhost:${PORT}/health`);
  
  // Connect to MongoDB after server starts
  connectToMongoDB().catch(err => {
    console.error('❌ Failed to connect to MongoDB on startup:', err.message);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });
}); 