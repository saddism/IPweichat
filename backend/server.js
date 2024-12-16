const express = require('express');
const cors = require('cors');
const config = require('./config/config');
const configRoutes = require('./routes/configRoutes');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize config system
config.initializeConfig().catch(console.error);

// Routes
app.use('/api/config', configRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});

module.exports = app; // Export for testing
