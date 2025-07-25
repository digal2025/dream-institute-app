require('dotenv').config();
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;

// Setup MongoDB Memory Server
beforeAll(async () => {
  // Disconnect any existing connections first
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

// Clean up after each test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
});

// Cleanup after all tests
afterAll(async () => {
  await mongoose.connection.close();
  await mongod.stop();
});

// Mock environment variables for testing
process.env.SENDGRID_API_KEY = 'test-api-key';
process.env.SENDGRID_FROM_EMAIL = 'test@example.com';
process.env.TWILIO_ACCOUNT_SID = 'test-account-sid';
process.env.TWILIO_AUTH_TOKEN = 'test-auth-token';
process.env.TWILIO_WHATSAPP_NUMBER = '+1234567890';
process.env.TWILIO_PHONE_NUMBER = '+1234567890'; 