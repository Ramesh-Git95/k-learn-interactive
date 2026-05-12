const express = require('express');
require('dotenv').config();

console.log('🟢 Testing minimal server...');

const app = express();
const PORT = process.env.PORT || 5001;

app.get('/', (req, res) => {
  res.json({ message: 'Test server working!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
});

console.log('📍 Server setup complete');
