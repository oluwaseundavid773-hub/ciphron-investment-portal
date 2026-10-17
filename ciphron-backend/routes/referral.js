const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Correct: models folder is at root level
const auth = require('./middleware/auth'); // FIXED: middleware is inside routes/middleware/

// @route   GET /api/referral
// @desc    Get user referral stats and downline list
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Generate a referral code if not already saved
    const referralCode = user.referralCode || `${user.name.toUpperCase().replace(/\s+/g, '_')}_${user._id.toString().slice(-4)}`;

    // Query all users referred by this user
    const referralsList = await User.find({ referredBy: user._id }).select('name email stakedCapital createdAt');

    const totalReferrals = referralsList.length;
    let activeDownlineCapital = 0;
    
    referralsList.forEach(ref => {
      activeDownlineCapital += (ref.stakedCapital || 0);
    });

    const totalCommissionEarned = activeDownlineCapital * 0.05; // 5% Commission

    res.json({
      success: true,
      data: {
        user: { name: user.name, email: user.email },
        referralCode,
        totalReferrals,
        activeDownlineCapital,
        totalCommissionEarned,
        unlockedCommission: totalCommissionEarned,
        referralsList
      }
    });
  } catch (err) {
    console.error('Referral API error:', err);
    res.status(500).json({ success: false, error: 'Server error fetching referrals' });
  }
});

module.exports = router;
