const express = require('express');

const app = express();

app.use(express.json());

// Main health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'ONLINE', 
        system: 'CIPHRON Treasury API v1.0',
        environment: process.env.NODE_ENV || 'production'
    });
});

// Fallback health check endpoint (if Vercel strips /api during routing)
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'ONLINE', 
        system: 'CIPHRON Treasury API v1.0',
        environment: process.env.NODE_ENV || 'production'
    });
});

module.exports = app;
