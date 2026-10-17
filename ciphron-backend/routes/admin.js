const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Correct: models folder is at root level
const Wallet = require('../models/Wallet'); // Correct: models folder is at root level
const Transaction = require('../models/Transaction'); // Correct: models folder is at root level
const Investment = require('../models/Investment'); // Correct: models folder is at root level
const auth = require('./middleware/auth'); // FIXED: middleware is inside routes/middleware/

// Middleware to ensure user has Admin privileges
const adminAuth = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied. Admin privileges required.' });
    }
    next();
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server authorization error' });
  }
};

// @route   GET /api/admin/overview
// @desc    Get system-wide stats, pending deposits, pending cashouts, and users
// @access  Private (Admin)
router.get('/overview', auth, adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const pendingTransactions = await Transaction.find({ status: 'Pending' }).populate('user', 'name email');
    const pendingKycUsers = await User.find({ kycStatus: 'Pending' }).select('name email kycDetails createdAt');
    const allUsers = await User.find().select('name email kycStatus role createdAt');

    res.json({
      success: true,
      data: {
        totalUsers,
        pendingTransactions,
        pendingKycUsers,
        users: allUsers
      }
    });
  } catch (err) {
    console.error('Admin overview error:', err);
    res.status(500).json({ success: false, error: 'Server error fetching admin stats' });
  }
});

// @route   POST /api/admin/approve-deposit
// @desc    Approve a pending user deposit and credit their wallet balance
// @access  Private (Admin)
router.post('/approve-deposit', auth, adminAuth, async (req, res) => {
  try {
    const { transactionId } = req.body;

    const transaction = await Transaction.findById(transactionId);
    if (!transaction || transaction.type !== 'Deposit' || transaction.status !== 'Pending') {
      return res.status(400).json({ success: false, error: 'Invalid or already processed transaction' });
    }

    // Update transaction status
    transaction.status = 'Completed';
    await transaction.save();

    // Credit user's wallet
    let wallet = await Wallet.findOne({ user: transaction.user });
    if (wallet) {
      wallet.balance += transaction.amount;
      await wallet.save();
    }

    res.json({ success: true, message: 'Deposit approved and wallet credited successfully' });
  } catch (err) {
    console.error('Approve deposit error:', err);
    res.status(500).json({ success: false, error: 'Server error approving deposit' });
  }
});

// @route   POST /api/admin/approve-kyc
// @desc    Approve or reject a user's KYC application
// @access  Private (Admin)
router.post('/approve-kyc', auth, adminAuth, async (req, res) => {
  try {
    const { userId, status } = req.body; // status: 'Verified' or 'Rejected'

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
