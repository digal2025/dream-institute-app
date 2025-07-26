const express = require('express');
const path = require('path');
const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client/build')));

// Basic test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Simple server is working!' });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

const PORT = 3001;

app.listen(PORT, () => {
  console.log(`Simple server running on port ${PORT}`);
  console.log(`Application available at: http://localhost:${PORT}`);
}); 