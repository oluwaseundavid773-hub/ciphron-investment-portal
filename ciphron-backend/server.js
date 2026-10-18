const express = require('express');

const app = express();

app.use(express.json());

// Simple health check with no DB dependency
app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'ONLINE', 
        system: 'CIPHRON Treasury API v1.0',
        environment: process.env.NODE_ENV || 'production'
    });
});

// Export raw express app for Vercel
module.exports = app;
