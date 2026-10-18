// routes/wallet.js
const express = require('express');
const router = express.Router();
const Wallet = require('../models/Wallet');
const Investment = require('../models/Investment');
const Transaction = require('../models/Transaction');
const auth = require('./middleware/auth'); // FIXED: middleware is inside routes/middleware/

// @route   POST /api/wallet/deposit
// @desc    Initiate a wallet deposit
// @access  Private
router.post('/deposit', auth, async (req, res) => {
  try {
    const { amount, reference, paymentMethod } = req.body;
    const userId = req.user.id || req.user.userId;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Please enter a valid deposit amount.' });
    }

    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found.' });
    }

    // For instant test environments: auto-complete deposit and credit balance.
    // In production, keep status as 'pending' until webhook/admin verification.
    wallet.balance += Number(amount);
    wallet.updatedAt = Date.now();
    await wallet.save();

    // Log in Transaction Ledger
    const transaction = new Transaction({
      user: userId,
      type: 'deposit',
      amount,
      status: 'completed', // Change to 'pending' if manual admin approval is needed
      reference: reference || `DEP-${Date.now()}`,
      description: `Wallet deposit via ${paymentMethod || 'Direct Transfer'}`
    });
    await transaction.save();

    res.status(200).json({
      success: true,
      message: 'Deposit processed successfully!',
      newBalance: wallet.balance,
      transaction
    });

  } catch (err) {
    console.error('Deposit Error:', err.message);
    res.status(500).json({ error: 'Server error processing deposit.' });
  }
});

// @route   POST /api/wallet/withdraw
// @desc    Initiate a payout request
// @access  Private
router.post('/withdraw', auth, async (req, res) => {
  try {
    const { amount, payoutAddress, paymentMethod } = req.body;
    const userId = req.user.id || req.user.userId;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Please enter a valid withdrawal amount.' });
    }

    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found.' });
    }

    // Check if user has sufficient available balance
    if (wallet.balance < amount) {
      return res.status(400).json({ error: 'Insufficient withdrawable balance.' });
    }

    // Deduct amount from available balance immediately to prevent double spending
    wallet.balance -= Number(amount);
    wallet.totalWithdrawn += Number(amount);
    wallet.updatedAt = Date.now();
    await wallet.save();

    // Create a pending transaction record for financial approval
    const transaction = new Transaction({
      user: userId,
      type: 'withdrawal',
      amount,
      status: 'pending', // Pending treasury release
      reference: `WD-${Date.now()}`,
      description: `Withdrawal request to ${payoutAddress || paymentMethod || 'Registered Account'}`
    });
    await transaction.save();

    res.status(200).json({
      success: true,
      message: 'Withdrawal request submitted successfully and is pending approval.',
      remainingBalance: wallet.balance,
      transaction
    });

  } catch (err) {
    console.error('Withdrawal Error:', err.message);
    res.status(500).json({ error: 'Server error processing withdrawal.' });
  }
});

module.exports = router;
