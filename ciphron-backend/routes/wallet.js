// routes/wallet.js
const express = require('express');
const router = express.Router();
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const auth = require('./middleware/auth');

const MIN_DEPOSIT = 100;

// @route   POST /api/wallet/deposit
// @desc    Submit a deposit for treasury verification (does NOT credit balance)
// @access  Private
router.post('/deposit', auth, async (req, res) => {
  try {
    const { amount, reference, paymentMethod } = req.body;
    const userId = req.user.id || req.user.userId;
    const amt = Number(amount);

    if (!Number.isFinite(amt) || amt < MIN_DEPOSIT) {
      return res.status(400).json({ error: `Minimum deposit is $${MIN_DEPOSIT}.` });
    }

    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found.' });
    }

    // Balance is NOT changed here. It is credited only after you verify the payment.
    const transaction = await Transaction.create({
      user: userId,
      type: 'deposit',
      amount: amt,
      status: 'pending',
      reference: String(reference || `DEP-${Date.now()}`).trim().slice(0, 100),
      description: `Deposit via ${paymentMethod || 'Direct Transfer'} - awaiting verification`
    });

    res.status(200).json({
      success: true,
      message: 'Deposit submitted. Your balance updates after treasury verification.',
      transaction
    });

  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'This transaction reference was already submitted.' });
    }
    console.error('Deposit Error:', err.message);
    res.status(500).json({ error: 'Server error processing deposit.' });
  }
});

// @route   POST /api/wallet/withdraw
// @desc    Request a withdrawal (balance is held immediately, payout is manual)
// @access  Private
router.post('/withdraw', auth, async (req, res) => {
  try {
    const { amount, address, payoutAddress, paymentMethod } = req.body;
    const userId = req.user.id || req.user.userId;
    const amt = Number(amount);
    const destination = address || payoutAddress || paymentMethod;

    if (!Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({ error: 'Please enter a valid withdrawal amount.' });
    }

    // Check balance and deduct in ONE step so two quick requests can't spend the same money
    const wallet = await Wallet.findOneAndUpdate(
      { user: userId, balance: { $gte: amt } },
      { $inc: { balance: -amt, totalWithdrawn: amt }, $set: { updatedAt: Date.now() } },
      { new: true }
    );

    if (!wallet) {
      return res.status(400).json({ error: 'Insufficient withdrawable balance.' });
    }

    let transaction;
    try {
      transaction = await Transaction.create({
        user: userId,
        type: 'withdrawal',
        amount: amt,
        status: 'pending',
        reference: `WD-${Date.now()}`,
        description: `Withdrawal request to ${destination || 'Registered Account'}`
      });
    } catch (txErr) {
      // Put the money back if the record could not be saved
      await Wallet.updateOne({ user: userId }, { $inc: { balance: amt, totalWithdrawn: -amt } });
      throw txErr;
    }

    res.status(200).json({
      success: true,
      message: 'Withdrawal request submitted and is pending approval.',
      remainingBalance: wallet.balance,
      transaction
    });

  } catch (err) {
    console.error('Withdrawal Error:', err.message);
    res.status(500).json({ error: 'Server error processing withdrawal.' });
  }
});

module.exports = router;
