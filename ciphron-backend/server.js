const express = require('express');
const cors = require('cors');
// Include your other database/route imports here...

const app = express();

app.use(cors());
app.use(express.json());

// Example API routes placeholder (ensure your actual routes are mounted here)
// app.use('/api/auth', authRoutes);
// app.use('/api/wallet', walletRoutes);
// app.use('/api/investments', investmentRoutes);
// app.use('/api/admin', adminRoutes);
// app.use('/api/kyc', kycRoutes);
// app.use('/api/referrals', referralRoutes);

app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Ciphron API is live on Vercel!' });
});

// ONLY listen locally if not running on Vercel serverless environment
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running locally on port ${PORT}`);
    });
}

// CRITICAL: Export the express app for Vercel serverless execution
module.exports = app;
