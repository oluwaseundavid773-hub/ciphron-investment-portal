// routes/dashboard.js
const express = require('express');
const router = express.Router();
const Wallet = require('../models/Wallet');
const Investment = require('../models/Investment');
const Transaction = require('../models/Transaction');
const auth = require('./middleware/auth'); // FIXED: middleware is inside routes/middleware/

// @route   GET /api/dashboard
// @desc    Fetch user dashboard financial metrics & ledger summary
// @access  Private (Requires authentication middleware)
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;

    // Fetch user's wallet
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found for this user' });
    }

    // Fetch active investments
    const investments = await Investment.find({ user: userId, status: 'active' });

    // Fetch recent transactions (last 5)
    const recentTransactions = await Transaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        wallet: {
          balance: wallet.balance,
          totalInvested: wallet.totalInvested,
          totalEarnings: wallet.totalEarnings,
          totalWithdrawn: wallet.totalWithdrawn,
          currency: wallet.currency
        },
        activeInvestmentsCount: investments.length,
        investments,
        recentTransactions
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error while fetching dashboard data' });
  }
});

module.exports = router;
