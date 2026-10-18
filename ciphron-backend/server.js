const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./db');

const app = express();
app.set('trust proxy', 1);

connectDB();

app.use(helmet());
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500', 'https://ciphron-investment-portal.vercel.app'],
    credentials: true
}));
app.use(express.json());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

const authMiddleware = require('./routes/middleware/auth');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const investmentRoutes = require('./routes/investments');
const kycRoutes = require('./routes/kyc');
const referralRoutes = require('./routes/referral');
const walletRoutes = require('./routes/wallet');
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/investments', authMiddleware, investmentRoutes);
app.use('/api/kyc', authMiddleware, kycRoutes);
app.use('/api/referrals', authMiddleware, referralRoutes);
app.use('/api/wallet', authMiddleware, walletRoutes);
app.use('/api/admin', authMiddleware, adminRoutes);

app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Ciphron API is live!' });
});

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`🚀 CIPHRON Server running on port ${PORT}`);
    });
}

module.exports = app;
