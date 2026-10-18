const express = require('express');
const cors = require('cors');

const app = express();

// Enable CORS for frontend requests
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ONLINE',
        system: 'CIPHRON Treasury API v1.0',
        environment: process.env.NODE_ENV || 'production'
    });
});

// Fallback endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ONLINE',
        system: 'CIPHRON Treasury API v1.0',
        environment: process.env.NODE_ENV || 'production'
    });
});

// --- ADD YOUR OTHER API ROUTES HERE (e.g., /api/auth, /api/investments) ---

// Export for Vercel execution
module.exports = app;
