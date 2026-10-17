const express = require('express');
const serverless = require('serverless-http');

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

// Export for Vercel serverless execution
module.exports = app;
module.exports.handler = serverless(app);
