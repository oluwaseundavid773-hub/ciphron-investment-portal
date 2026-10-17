// models/Wallet.js
const mongoose = require('mongoose');

const WalletSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  balance: { type: Number, default: 0.00 },          // Available withdrawable/investable balance
  totalInvested: { type: Number, default: 0.00 },    // Active capital in packages
  totalEarnings: { type: Number, default: 0.00 },    // Cumulative ROI yields earned
  totalWithdrawn: { type: Number, default: 0.00 },   // Lifetime withdrawals
  currency: { type: String, default: 'USD' },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Wallet', WalletSchema);
