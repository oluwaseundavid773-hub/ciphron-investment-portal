const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const auth = require('./middleware/auth');

// Middleware to ensure user has Admin privileges (checked against the database)
const adminAuth = async (req, res, next) => {
  try {
    const adminId = req.user.id || req.user.userId;
    const user = await User.findById(adminId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied. Admin privileges required.' });
    }
    next();
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server authorization error' });
  }
};

// @route   GET /api/admin/overview
// @desc    System stats, pending deposits/withdrawals, pending KYC and users
// @access  Private (Admin)
router.get('/overview', auth, adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const pendingTransactions = await Transaction.find({ status: 'pending' })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    const pendingKycUsers = await User.find({ kycStatus: 'Pending' }).select('name email kycDetails createdAt');
    const allUsers = await User.find().select('name email kycStatus role createdAt');

    res.json({
      success: true,
      data: { totalUsers, pendingTransactions, pendingKycUsers, users: allUsers }
    });
  } catch (err) {
    console.error('Admin overview error:', err);
    res.status(500).json({ success: false, error: 'Server error fetching admin stats' });
  }
});

// @route   POST /api/admin/approve-deposit
// @desc    Approve a pending deposit at the amount you actually received
// @body    { transactionId, receivedAmount }  (receivedAmount optional: defaults to the requested amount)
// @access  Private (Admin)
router.post('/approve-deposit', auth, adminAuth, async (req, res) => {
  try {
    const { transactionId, receivedAmount } = req.body;

    if (!mongoose.isValidObjectId(transactionId)) {
      return res.status(400).json({ success: false, error: 'Invalid transaction id' });
    }

    // Look at the request first to get the default amount
    const existing = await Transaction.findOne({ _id: transactionId, type: 'deposit', status: 'pending' });
    if (!existing) {
      return res.status(400).json({ success: false, error: 'Invalid or already processed transaction' });
    }

    const received = receivedAmount === undefined || receivedAmount === ''
      ? existing.amount
      : Number(receivedAmount);

    if (!Number.isFinite(received) || received <= 0) {
      return res.status(400).json({ success: false, error: 'Enter the amount you actually received.' });
    }

    // Claim it so one deposit can only be approved once
    const tx = await Transaction.findOneAndUpdate(
      { _id: transactionId, type: 'deposit', status: 'pending' },
      { $set: { status: 'completed', amount: received } },
      { new: false }
    );
    if (!tx) {
      return res.status(400).json({ success: false, error: 'Invalid or already processed transaction' });
    }

    // Credit the wallet
    const result = await Wallet.updateOne(
      { user: tx.user },
      { $inc: { balance: received }, $set: { updatedAt: Date.now() } }
    );
    if (result.matchedCount === 0) {
      // Undo the claim if the wallet is missing
      await Transaction.updateOne({ _id: tx._id }, { $set: { status: 'pending', amount: tx.amount } });
      return res.status(404).json({ success: false, error: 'Wallet not found for this user' });
    }

    // Keep a record of who approved it and what changed
    await Transaction.updateOne({ _id: tx._id }, {
      $set: {
        description: `${tx.description || 'Deposit'} | approved by admin ${req.user.id || req.user.userId}: requested $${tx.amount}, credited $${received}`
      }
    });

    res.json({ success: true, message: `Deposit approved. $${received} credited to the wallet.` });
  } catch (err) {
    console.error('Approve deposit error:', err);
    res.status(500).json({ success: false, error: 'Server error approving deposit' });
  }
});

// @route   POST /api/admin/reject-deposit
// @desc    Reject a pending deposit (nothing is credited)
// @access  Private (Admin)
router.post('/reject-deposit', auth, adminAuth, async (req, res) => {
  try {
    const { transactionId } = req.body;

    if (!mongoose.isValidObjectId(transactionId)) {
      return res.status(400).json({ success: false, error: 'Invalid transaction id' });
    }

    const tx = await Transaction.findOneAndUpdate(
      { _id: transactionId, type: 'deposit', status: 'pending' },
      { $set: { status: 'failed' } }
    );
    if (!tx) {
      return res.status(400).json({ success: false, error: 'Invalid or already processed transaction' });
    }

    res.json({ success: true, message: 'Deposit rejected. Nothing was credited.' });
  } catch (err) {
    console.error('Reject deposit error:', err);
    res.status(500).json({ success: false, error: 'Server error rejecting deposit' });
  }
});

// @route   POST /api/admin/approve-kyc
// @desc    Approve or reject a user's KYC application
// @access  Private (Admin)
router.post('/approve-kyc', auth, adminAuth, async (req, res) => {
  try {
    const { userId, status } = req.body; // status: 'Verified' or 'Rejected'

    if (!['Verified', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Status must be Verified or Rejected' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.kycStatus = status;
    await user.save();

    res.json({ success: true, message: `User KYC status updated to ${status}` });
  } catch (err) {
    console.error('Approve KYC error:', err);
    res.status(500).json({ success: false, error: 'Server error updating KYC' });
  }
});

module.exports = router;
