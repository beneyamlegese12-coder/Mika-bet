// backend/src/models/BetSlip.js
import mongoose from 'mongoose';

const betSlipSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  bets: [{
    match: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
      required: true,
    },
    selection: {
      type: String,
      required: true,
    },
    odds: {
      type: Number,
      required: true,
    },
    amount: {
      type: Number,
      default: 0,
    },
  }],
  totalOdds: {
    type: Number,
    default: 0,
  },
  totalStake: {
    type: Number,
    default: 0,
  },
  potentialWin: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'PLACED', 'CLEARED'],
    default: 'ACTIVE',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

const BetSlip = mongoose.model('BetSlip', betSlipSchema);

export default BetSlip;