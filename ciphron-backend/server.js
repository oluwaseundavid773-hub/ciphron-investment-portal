const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const serverless = require('serverless-http');
require('dotenv').config();

const connectDB = require('./db'); // Import database connection

const app = express();

// Connect to MongoDB
connectDB();

// Security Headers
app.use(helmet());

// Enable CORS for your frontend
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'https://ciphron-investment-portal.vercel.app'],
    credentials: true
}));

app.use(express.json());

// Rate Limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Health Check Route
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ONLINE', system: 'CIPHRON Treasury API v1.0' });
});

// ----- Routes -----
const authRoutes = require('./routes/auth');
const authMiddleware = require('./routes/middleware/auth'); // declared ONCE only
const dashboardRoutes = require('./routes/dashboard');
const investmentsRoutes = require('./routes/investments');
const walletRoutes = require('./routes/wallet');
const kycRoutes = require('./routes/kyc');         
const adminRoutes = require('./routes/admin');     
const referralRoutes = require('./routes/referral'); 

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/investments', authMiddleware, investmentsRoutes);
app.use('/api/wallet', authMiddleware, walletRoutes);
app.use('/api/kyc', authMiddleware, kycRoutes);     
app.use('/api/admin', authMiddleware, adminRoutes); 
app.use('/api/referral', authMiddleware, referralRoutes); 

// ----- Start server locally (ignored on Vercel) -----
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🚀 CIPHRON Server running on port ${PORT}`);
    });
}

// Export for Vercel serverless execution
module.exports = app;
module.exports.handler = serverless(app);
