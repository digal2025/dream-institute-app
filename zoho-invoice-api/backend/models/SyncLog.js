const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI,  {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
  console.log('MongoDB Atlas connected');
});
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

const SyncLogSchema = new mongoose.Schema({
  sync_type: String, // e.g., 'customers', 'payments', 'invoices'
  started_at: Date,
  finished_at: Date,
  status: String, // 'success', 'error'
  error_message: String
});

module.exports = mongoose.model('SyncLog', SyncLogSchema); 