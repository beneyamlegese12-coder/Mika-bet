import mongoose from 'mongoose';

const betSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  match: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 1,
  },
  odds: {
    type: Number,
    required: true,
  },
  selection: {
    type: String,
    required: true,
    enum: ['1', 'X', '2', '1X', '12', 'X2', 'Yes', 'No', 'OVER', 'UNDER'],
  },
  potentialWin: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'WON', 'LOST', 'CANCELLED', 'VOID'],
    default: 'PENDING',
  },
  betslipId: {
    type: String,
    default: null,
    // Removed unique: true
  },
  placedAt: {
    type: Date,
    default: Date.now,
  },
  settledAt: {
    type: Date,
    default: null,
  },
  settledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
}, {
  timestamps: true,
});

// Indexes for faster queries
betSchema.index({ user: 1, placedAt: -1 });
betSchema.index({ match: 1, status: 1 });
betSchema.index({ status: 1 });
// Remove unique index on betslipId
// betSchema.index({ betslipId: 1 }); // Don't add this back

const Bet = mongoose.model('Bet', betSchema);

export default Bet;