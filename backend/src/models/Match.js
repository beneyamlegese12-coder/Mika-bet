import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema({
  league: {
    type: String,
    required: true,
  },
  homeTeam: {
    type: String,
    required: true,
  },
  awayTeam: {
    type: String,
    required: true,
  },
  homeTeamLogo: {
    type: String,
    default: '',
  },
  awayTeamLogo: {
    type: String,
    default: '',
  },
  homeOdds: {
    type: Number,
    required: true,
  },
  drawOdds: {
    type: Number,
    default: null,
  },
  awayOdds: {
    type: Number,
    required: true,
  },
  homeScore: {
    type: Number,
    default: null,
  },
  awayScore: {
    type: Number,
    default: null,
  },
  status: {
    type: String,
    enum: ['UPCOMING', 'LIVE', 'HALFTIME', 'FINISHED', 'CANCELLED', 'POSTPONED'],
    default: 'UPCOMING',
  },
  kickoff: {
    type: Date,
    required: true,
  },
  doubleChance: {
    '1X': { type: Number, default: null },
    '12': { type: Number, default: null },
    'X2': { type: Number, default: null },
  },
  bothScore: {
    yes: { type: Number, default: null },
    no: { type: Number, default: null },
  },
  overUnder: {
    over2_5: { type: Number, default: null },
    under2_5: { type: Number, default: null },
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

// Indexes
matchSchema.index({ status: 1, kickoff: 1 });
matchSchema.index({ league: 1 });

const Match = mongoose.model('Match', matchSchema);

export default Match;