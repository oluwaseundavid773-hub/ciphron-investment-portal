// routes/kyc.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('./middleware/auth'); // FIXED: middleware is inside routes/middleware/

// @route   POST /api/kyc/submit
// @desc    Submit KYC documents and carrier data for review
// @access  Private
router.post('/submit', auth, async (req, res) => {
  try {
    const { fullName, documentType, documentNumber, phone, carrierVerified } = req.body;
    const userId = req.user.id || req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Update user KYC fields
    user.kycStatus = 'Under Review';
    user.kycDetails = {
      fullName,
      documentType,
      documentNumber,
      phone,
      carrierVerified,
      submittedAt: new Date()
    };

    await user.save();

    res.json({
      success: true,
      message: 'KYC documents and carrier details submitted successfully under review.'
    });
  } catch (err) {
    console.error('KYC submission error:', err);
    res.status(500).json({ success: false, error: 'Server error submitting KYC details' });
  }
});

module.exports = router;