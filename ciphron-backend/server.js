const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Import your route files from the 'routes' folder
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const investmentRoutes = require('./routes/investments');
const kycRoutes = require('./routes/kyc');
const referralRoutes = require('./routes/referral');
const walletRoutes = require('./routes/wallet'); // check lowercase/uppercase filename if needed
const adminRoutes = require('./routes/admin');

// Mount them with the /api prefix so they match Vercel's rewrites
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Ciphron API is live on Vercel!' });
});

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running locally on port ${PORT}`);
    });
}

module.exports = app;