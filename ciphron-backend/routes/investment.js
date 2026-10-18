// routes/investments.js
const express = require('express');
const router = express.Router();
const Wallet = require('../models/Wallet');
const Investment = require('../models/Investment');
const Transaction = require('../models/Transaction');
const auth = require('./middleware/auth'); // FIXED: middleware is inside routes/middleware/

// @route   POST /api/investments/create
// @desc    Create a new investment package allocation
// @access  Private
router.post('/create', auth, async (req, res) => {
  try {
    const { packageName, amount, dailyRoiPercent, durationDays } = req.body;
    const userId = req.user.id || req.user.userId;

    // 1. Basic validation
    if (!packageName || !amount || amount <= 0 || !dailyRoiPercent || !durationDays) {
      return res.status(400).json({ error: 'Please provide all valid investment details.' });
    }

    // 2. Fetch user's wallet
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found.' });
    }

    // 3. Check for sufficient wallet balance
    if (wallet.balance < amount) {
      return res.status(400).json({ error: 'Insufficient wallet balance to activate this package.' });
    }

    // 4. Calculate maturity/end date
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + parseInt(durationDays));

    // 5. Create new Investment entry
    const newInvestment = new Investment({
      user: userId,
      packageName,
      amount,
      dailyRoiPercent,
      durationDays,
      startDate,
      endDate,
      status: 'active'
    });
    await newInvestment.save();

    // 6. Update Wallet: deduct balance & add to totalInvested
    wallet.balance -= Number(amount);
    wallet.totalInvested += Number(amount);
    wallet.updatedAt = Date.now();
    await wallet.save();

    // 7. Record transaction in the immutable ledger
    const transaction = new Transaction({
      user: userId,
      type: 'investment',
      amount,
      status: 'completed',
      description: `Allocated $${amount} into ${packageName} (${dailyRoiPercent}% daily for ${durationDays} days)`
    });
    await transaction.save();

    res.status(201).json({
      success: true,
      message: 'Investment successfully activated!',
      investment: newInvestment,
      updatedWallet: {
        balance: wallet.balance,
        totalInvested: wallet.totalInvested
      }
    });

  } catch (err) {
    console.error('Investment Creation Error:', err.message);
    res.status(500).json({ error: 'Server error processing investment allocation.' });
  }
});

module.exports = router;
