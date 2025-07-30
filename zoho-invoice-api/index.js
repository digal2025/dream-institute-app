require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
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

// CORS Configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://fees.dreaminstitute.co.in', 'https://www.fees.dreaminstitute.co.in']
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

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

// Zoho OAuth Routes (must be before API routes)
app.get('/auth/zoho', (req, res) => {
  const clientId = process.env.ZOHO_CLIENT_ID;
  const redirectUri = process.env.ZOHO_REDIRECT_URI;
  const scope = 'ZohoInvoice.FullAccess.all';
  
  if (!clientId || !redirectUri) {
    return res.status(500).json({ error: 'Missing Zoho OAuth configuration' });
  }
  
  const authUrl = `https://accounts.zoho.in/oauth/v2/auth?response_type=code&client_id=${clientId}&scope=${scope}&redirect_uri=${encodeURIComponent(redirectUri)}&access_type=offline`;
  res.redirect(authUrl);
});

app.get('/auth/zoho/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).send(`
      <script>
        alert('Zoho authentication failed: No authorization code received');
        window.close();
      </script>
    `);
  }
  
  try {
    console.log('🔄 Exchanging Zoho authorization code for tokens...');
    
    // Exchange authorization code for access tokens
    const tokenResponse = await fetch('https://accounts.zoho.in/oauth/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.ZOHO_CLIENT_ID,
        client_secret: process.env.ZOHO_CLIENT_SECRET,
        redirect_uri: process.env.ZOHO_REDIRECT_URI,
        code: code
      })
    });
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      console.error('❌ Zoho token exchange failed:', tokenData);
      throw new Error(tokenData.error || 'Token exchange failed');
    }
    
    console.log('✅ Token exchange successful');
    
    // Calculate token expiry date
    const expiresIn = tokenData.expires_in || 3600; // Default 1 hour
    const tokenExpiry = new Date(Date.now() + (expiresIn * 1000));
    
    // Import Token model
    const Token = require('./backend/models/Token');
    
    // Store tokens in database (replace any existing tokens)
    await Token.deleteMany({}); // Remove old tokens
    const newToken = new Token({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenExpiry: tokenExpiry
    });
    
    await newToken.save();
    console.log('💾 Tokens saved to database successfully');
    
    // Send success response
    res.send(`
      <script>
        alert('Zoho authentication successful! Access tokens have been securely stored. You can now sync data.');
        window.close();
      </script>
    `);
    
  } catch (error) {
    console.error('❌ OAuth callback error:', error.message);
    
    // Send error response
    res.send(`
      <script>
        alert('Zoho authentication failed: ${error.message}');
        window.close();
      </script>
    `);
  }
});

// Helper function to refresh Zoho access token
async function refreshZohoToken(refreshToken) {
  try {
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    console.log('🔄 Refreshing Zoho access token...');
    
    const refreshResponse = await fetch('https://accounts.zoho.in/oauth/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.ZOHO_CLIENT_ID,
        client_secret: process.env.ZOHO_CLIENT_SECRET,
        refresh_token: refreshToken
      })
    });
    
    const refreshData = await refreshResponse.json();
    
    if (!refreshResponse.ok) {
      console.error('❌ Token refresh failed:', refreshData);
      throw new Error(refreshData.error || 'Token refresh failed');
    }
    
    console.log('✅ Token refresh successful');
    
    // Calculate new token expiry
    const expiresIn = refreshData.expires_in || 3600;
    const tokenExpiry = new Date(Date.now() + (expiresIn * 1000));
    
    // Update token in database
    const Token = require('./backend/models/Token');
    await Token.deleteMany({});
    
    const newToken = new Token({
      accessToken: refreshData.access_token,
      refreshToken: refreshData.refresh_token || refreshToken, // Use new refresh token if provided, otherwise keep the old one
      tokenExpiry: tokenExpiry
    });
    
    await newToken.save();
    console.log('💾 Refreshed tokens saved to database');
    
    return newToken;
    
  } catch (error) {
    console.error('❌ Token refresh error:', error.message);
    throw error;
  }
}

// Token status endpoint
app.get('/api/token/status', async (req, res) => {
  try {
    const Token = require('./backend/models/Token');
    const token = await Token.findOne().sort({ createdAt: -1 });
    
    if (!token || !token.accessToken) {
      return res.json({ 
        hasToken: false, 
        tokenExpiry: null,
        message: 'No Zoho access token found. Please authenticate first.' 
      });
    }
    
    // Check if token is expired
    const now = new Date();
    const isExpired = token.tokenExpiry && token.tokenExpiry < now;
    
    if (isExpired) {
      console.log('🔄 Access token expired, attempting refresh...');
      
      try {
        // Attempt to refresh the token
        const refreshedToken = await refreshZohoToken(token.refreshToken);
        if (refreshedToken) {
          return res.json({ 
            hasToken: true, 
            tokenExpiry: refreshedToken.tokenExpiry.toISOString(),
            message: 'Token refreshed successfully' 
          });
        }
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError.message);
        return res.json({ 
          hasToken: false, 
          tokenExpiry: null,
          message: 'Token expired and refresh failed. Please re-authenticate.' 
        });
      }
    }
    
    res.json({ 
      hasToken: true, 
      tokenExpiry: token.tokenExpiry ? token.tokenExpiry.toISOString() : null,
      message: 'Valid Zoho access token found' 
    });
    
  } catch (error) {
    console.error('❌ Token status check error:', error.message);
    res.status(500).json({ 
      hasToken: false, 
      tokenExpiry: null,
      message: 'Error checking token status' 
    });
  }
});

// Helper function to get current valid access token
async function getCurrentAccessToken() {
  try {
    const Token = require('./backend/models/Token');
    const token = await Token.findOne().sort({ createdAt: -1 });
    
    if (!token || !token.accessToken) {
      throw new Error('No access token found. Please authenticate first.');
    }
    
    // Check if token is expired
    const now = new Date();
    const isExpired = token.tokenExpiry && token.tokenExpiry < now;
    
    if (isExpired) {
      console.log('🔄 Access token expired, attempting refresh...');
      const refreshedToken = await refreshZohoToken(token.refreshToken);
      return refreshedToken.accessToken;
    }
    
    return token.accessToken;
    
  } catch (error) {
    console.error('❌ Error getting access token:', error.message);
    throw error;
  }
}

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