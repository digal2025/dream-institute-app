require('dotenv').config();
const express = require('express');
const app = express();

app.use(express.json());

// Simple test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
}); 