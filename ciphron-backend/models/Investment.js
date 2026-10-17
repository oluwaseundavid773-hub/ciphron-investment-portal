// models/Investment.js
const mongoose = require('mongoose');

const InvestmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  packageName: { type: String, required: true },     // e.g., "Institutional Yield Tier 1"
  amount: { type: Number, required: true },          // Principal capital invested
  dailyRoiPercent: { type: Number, required: true }, // Daily return rate (e.g., 2.5%)
  durationDays: { type: Number, required: true },    // Lockup duration in days
  totalProfitEarned: { type: Number, default: 0.00 },
  status: { 
    type: String, 
    enum: ['active', 'completed', 'cancelled'], 
    default: 'active' 
  },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true }
});

module.exports = mongoose.model('Investment', InvestmentSchema);
