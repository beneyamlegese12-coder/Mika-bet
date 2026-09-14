import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import connectDB from './src/config/database.js';

import User from './src/models/User.js';
import Match from './src/models/Match.js';
import Bet from './src/models/Bet.js';
import Transaction from './src/models/Transaction.js';
import BetSlip from './src/models/BetSlip.js';
import DepositRequest from './src/models/DepositRequest.js';
import WithdrawalRequest from './src/models/WithdrawalRequest.js';

import authRoutes from './src/routes/authRoutes.js';
import agentRoutes from './src/routes/agentRoutes.js';
import { authenticateToken, requireAdmin, requireAgent } from './src/middleware/auth.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// ===== WEB SOCKET =====
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

io.on('connection', (socket) => {
  console.log(`🟢 Client connected: ${socket.id}`);

  socket.on('join-match', (matchId) => {
    socket.join(`match-${matchId}`);
    console.log(`Socket ${socket.id} joined match-${matchId}`);
  });

  socket.on('leave-match', (matchId) => {
    socket.leave(`match-${matchId}`);
    console.log(`Socket ${socket.id} left match-${matchId}`);
  });

  socket.on('join-user', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`Socket ${socket.id} joined user-${userId}`);
  });

  socket.on('place-live-bet', async (data) => {
    try {
      const { matchId, amount, odds, selection, userId } = data;
      io.to(`match-${matchId}`).emit('bet-placed', {
        matchId,
        amount,
        odds,
        selection,
        timestamp: new Date(),
      });
      io.to(`user-${userId}`).emit('bet-confirmed', {
        success: true,
        matchId,
        amount,
        odds,
        selection,
      });
    } catch (error) {
      console.error('Live bet error:', error);
    }
  });

  socket.on('update-match', async (data) => {
    try {
      const { matchId, updates } = data;
      io.to(`match-${matchId}`).emit('match-updated', {
        matchId,
        updates,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Match update error:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔴 Client disconnected: ${socket.id}`);
  });
});

app.set('io', io);

// ===== HEALTH CHECK =====
app.get('/health', async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: dbStatus,
    websocket: 'active',
    version: '1.0.0',
  });
});

// ===== AUTH ROUTES =====
app.use('/api/auth', authRoutes);

// ===== AGENT ROUTES (Deposit/Withdraw Requests) =====
app.use('/api', agentRoutes);

// ===== MATCH ROUTES =====

app.get('/api/matches/live', async (req, res) => {
  try {
    const matches = await Match.find({
      status: { $in: ['LIVE', 'HALFTIME'] },
    }).sort({ kickoff: 1 });
    res.json({ success: true, data: matches, count: matches.length });
  } catch (error) {
    console.error('Live matches error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch live matches' });
  }
});

app.get('/api/matches/leagues', async (req, res) => {
  try {
    const leagues = await Match.distinct('league');
    res.json({ success: true, data: leagues.sort() });
  } catch (error) {
    console.error('Leagues error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leagues' });
  }
});

app.get('/api/matches', async (req, res) => {
  try {
    const { status, league, limit = 50, page = 1 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (league) filter.league = { $regex: league, $options: 'i' };
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const matches = await Match.find(filter).sort({ kickoff: 1 }).skip(skip).limit(parseInt(limit));
    const total = await Match.countDocuments(filter);

    if (matches.length === 0 && page === 1) {
      const seedMatches = [
        {
          league: 'UEFA Champions League',
          homeTeam: 'Real Madrid',
          awayTeam: 'Bayern Munich',
          homeOdds: 2.15,
          drawOdds: 3.40,
          awayOdds: 3.20,
          kickoff: new Date(Date.now() + 2 * 60 * 60 * 1000),
          status: 'UPCOMING',
          doubleChance: { '1X': 1.60, '12': 1.27, 'X2': 1.32 },
          bothScore: { yes: 1.61, no: 2.17 },
        },
        {
          league: 'USA-NBA',
          homeTeam: 'Los Angeles Lakers',
          awayTeam: 'Boston Celtics',
          homeOdds: 1.85,
          drawOdds: null,
          awayOdds: 2.10,
          kickoff: new Date(Date.now() + 30 * 60 * 1000),
          status: 'LIVE',
          homeScore: 68,
          awayScore: 72,
        },
        {
          league: 'Premier League',
          homeTeam: 'Liverpool',
          awayTeam: 'Manchester City',
          homeOdds: 2.80,
          drawOdds: 3.20,
          awayOdds: 2.40,
          kickoff: new Date(Date.now() + 4 * 60 * 60 * 1000),
          status: 'UPCOMING',
        },
        {
          league: 'La Liga',
          homeTeam: 'Barcelona',
          awayTeam: 'Atletico Madrid',
          homeOdds: 1.95,
          drawOdds: 3.10,
          awayOdds: 3.80,
          kickoff: new Date(Date.now() + 6 * 60 * 60 * 1000),
          status: 'UPCOMING',
        },
        {
          league: 'Serie A',
          homeTeam: 'AC Milan',
          awayTeam: 'Inter Milan',
          homeOdds: 2.40,
          drawOdds: 3.00,
          awayOdds: 2.90,
          kickoff: new Date(Date.now() + 8 * 60 * 60 * 1000),
          status: 'UPCOMING',
        },
        {
          league: 'Bundesliga',
          homeTeam: 'Bayern Munich',
          awayTeam: 'Borussia Dortmund',
          homeOdds: 1.75,
          drawOdds: 3.50,
          awayOdds: 4.20,
          kickoff: new Date(Date.now() + 10 * 60 * 60 * 1000),
          status: 'UPCOMING',
        },
      ];
      await Match.insertMany(seedMatches);
      const newMatches = await Match.find(filter).sort({ kickoff: 1 });
      return res.json({ success: true, data: newMatches, pagination: { total: newMatches.length, page: 1, limit: parseInt(limit), pages: 1 } });
    }
    res.json({ success: true, data: matches, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    console.error('Matches error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch matches' });
  }
});

app.get('/api/matches/:id', async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
    res.json({ success: true, data: match });
  } catch (error) {
    console.error('Match error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch match' });
  }
});

// ===== BET ROUTES =====

app.post('/api/bets', authenticateToken, async (req, res) => {
  try {
    const { matchId, amount, odds, selection, betSlipId } = req.body;
    const user = req.user;

    if (!matchId || !amount || !odds || !selection) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    if (amount < 1) return res.status(400).json({ success: false, message: 'Minimum bet amount is 1 ETB' });
    if (user.balance < amount) return res.status(400).json({ success: false, message: 'Insufficient balance' });

    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
    if (match.status === 'FINISHED' || match.status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: `Match is already ${match.status.toLowerCase()}` });
    }

    const potentialWin = amount * odds;
    const bet = await Bet.create({
      user: user._id,
      match: matchId,
      amount,
      odds,
      selection,
      potentialWin,
      status: 'PENDING',
      betSlipId: betSlipId || null,
      placedAt: new Date(),
    });

    const balanceBefore = user.balance;
    const balanceAfter = user.balance - amount;
    await User.findByIdAndUpdate(user._id, { balance: balanceAfter });

    await Transaction.create({
      user: user._id,
      type: 'BET',
      amount: -amount,
      balanceBefore,
      balanceAfter,
      reference: bet._id.toString(),
      description: `Bet on ${match.homeTeam} vs ${match.awayTeam} - ${selection}`,
      status: 'COMPLETED',
    });

    user.logActivity('PLACE_BET', req, { matchId, amount, odds, selection, potentialWin });
    await user.save();
    req.user.balance = balanceAfter;

    io.to(`match-${matchId}`).emit('bet-placed', { matchId, amount, odds, selection, timestamp: new Date() });
    io.to(`user-${user._id}`).emit('bet-confirmed', { success: true, bet, newBalance: balanceAfter });

    res.json({ success: true, message: 'Bet placed successfully!', data: { bet, newBalance: balanceAfter, potentialWin } });
  } catch (error) {
    console.error('Bet error:', error);
    res.status(500).json({ success: false, message: 'Failed to place bet' });
  }
});

app.get('/api/bets', authenticateToken, async (req, res) => {
  try {
    const { status, limit = 50, page = 1 } = req.query;
    const filter = { user: req.user._id };
    if (status) filter.status = status;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const bets = await Bet.find(filter).populate('match').sort({ placedAt: -1 }).skip(skip).limit(parseInt(limit));
    const total = await Bet.countDocuments(filter);
    res.json({ success: true, data: bets, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    console.error('Bets error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bets' });
  }
});

app.get('/api/bets/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const [totalBets, totalWon, totalLost, totalPending] = await Promise.all([
      Bet.countDocuments({ user: userId }),
      Bet.countDocuments({ user: userId, status: 'WON' }),
      Bet.countDocuments({ user: userId, status: 'LOST' }),
      Bet.countDocuments({ user: userId, status: 'PENDING' }),
    ]);
    const winAmount = await Bet.aggregate([{ $match: { user: userId, status: 'WON' } }, { $group: { _id: null, total: { $sum: '$potentialWin' } } }]);
    const totalStaked = await Bet.aggregate([{ $match: { user: userId } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
    res.json({
      success: true,
      data: {
        totalBets,
        totalWon,
        totalLost,
        totalPending,
        winAmount: winAmount[0]?.total || 0,
        totalStaked: totalStaked[0]?.total || 0,
        winRate: totalBets > 0 ? (totalWon / totalBets) * 100 : 0,
      },
    });
  } catch (error) {
    console.error('Bet stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bet statistics' });
  }
});

// ===== WALLET ROUTES =====

app.get('/api/wallet', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('balance currency');
    const transactions = await Transaction.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
    const totalDeposited = await Transaction.aggregate([{ $match: { user: req.user._id, type: 'DEPOSIT', status: 'COMPLETED' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
    const totalWithdrawn = await Transaction.aggregate([{ $match: { user: req.user._id, type: 'WITHDRAW', status: 'COMPLETED' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
    const totalWon = await Transaction.aggregate([{ $match: { user: req.user._id, type: 'WINNING', status: 'COMPLETED' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
    res.json({
      success: true,
      data: {
        balance: user.balance,
        currency: user.currency,
        transactions,
        summary: {
          totalDeposited: totalDeposited[0]?.total || 0,
          totalWithdrawn: totalWithdrawn[0]?.total || 0,
          totalWon: totalWon[0]?.total || 0,
        },
      },
    });
  } catch (error) {
    console.error('Wallet error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch wallet' });
  }
});

// ===== DEPOSIT - RESTRICTED FOR PLAYERS (Must use agent system) =====
app.post('/api/wallet/deposit', authenticateToken, async (req, res) => {
  try {
    // BLOCK PLAYERS FROM DIRECT DEPOSIT
    if (req.user.role === 'player') {
      return res.status(403).json({
        success: false,
        message: 'Players must use the agent-based deposit system. Go to Deposit page and request deposit.',
        code: 'AGENT_DEPOSIT_REQUIRED',
      });
    }

    const { amount, receiptNumber, paymentMethod = 'TeleBirr' } = req.body;
    const user = req.user;
    if (!amount || amount < 10) return res.status(400).json({ success: false, message: 'Minimum deposit is 10 ETB' });
    if (amount > 100000) return res.status(400).json({ success: false, message: 'Maximum deposit is 100,000 ETB' });
    const balanceBefore = user.balance;
    const balanceAfter = user.balance + amount;
    await User.findByIdAndUpdate(user._id, { balance: balanceAfter });
    const transaction = await Transaction.create({
      user: user._id,
      type: 'DEPOSIT',
      amount,
      balanceBefore,
      balanceAfter,
      reference: receiptNumber || `DEP-${Date.now()}`,
      description: `Deposit via ${paymentMethod}`,
      status: 'COMPLETED',
    });
    req.user.balance = balanceAfter;
    user.logActivity('DEPOSIT', req, { amount, paymentMethod, receiptNumber });
    await user.save();
    io.to(`user-${user._id}`).emit('balance-updated', { newBalance: balanceAfter, transaction });
    res.json({ success: true, message: 'Deposit successful!', data: { balance: balanceAfter, transaction } });
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ success: false, message: 'Failed to process deposit' });
  }
});

app.post('/api/wallet/withdraw', authenticateToken, async (req, res) => {
  try {
    // BLOCK PLAYERS FROM DIRECT WITHDRAWAL
    if (req.user.role === 'player') {
      return res.status(403).json({
        success: false,
        message: 'Players must use the agent-based withdrawal system. Go to Withdraw page and request withdrawal.',
        code: 'AGENT_WITHDRAWAL_REQUIRED',
      });
    }

    const { amount, phoneNumber, bankAccount } = req.body;
    const user = req.user;
    if (!amount || amount < 50) return res.status(400).json({ success: false, message: 'Minimum withdrawal is 50 ETB' });
    if (user.balance < amount) return res.status(400).json({ success: false, message: 'Insufficient balance' });
    if (!phoneNumber && !bankAccount) return res.status(400).json({ success: false, message: 'Please provide phone number or bank account' });
    const balanceBefore = user.balance;
    const balanceAfter = user.balance - amount;
    await User.findByIdAndUpdate(user._id, { balance: balanceAfter });
    const transaction = await Transaction.create({
      user: user._id,
      type: 'WITHDRAW',
      amount: -amount,
      balanceBefore,
      balanceAfter,
      reference: `WTH-${Date.now()}`,
      description: `Withdrawal to ${phoneNumber ? `TeleBirr (${phoneNumber})` : `Bank Account (${bankAccount})`}`,
      status: 'PENDING',
    });
    req.user.balance = balanceAfter;
    user.logActivity('WITHDRAW', req, { amount, phoneNumber, bankAccount });
    await user.save();
    res.json({ success: true, message: 'Withdrawal request submitted! It will be processed within 24 hours.', data: { balance: balanceAfter, transaction } });
  } catch (error) {
    console.error('Withdraw error:', error);
    res.status(500).json({ success: false, message: 'Failed to process withdrawal' });
  }
});

// ===== AGENT ROUTES =====

app.get('/api/agent/players', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'agent') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin or Agent role required.' });
    }
    const players = await User.find({ role: 'player' }).select('-password -emailVerificationToken -resetPasswordToken -devices');
    res.json({ success: true, data: players, count: players.length });
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch players' });
  }
});

app.get('/api/agent/players/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'agent') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin or Agent role required.' });
    }
    const player = await User.findById(req.params.id).select('-password -emailVerificationToken -resetPasswordToken -devices');
    if (!player) return res.status(404).json({ success: false, message: 'Player not found' });
    res.json({ success: true, data: player });
  } catch (error) {
    console.error('Error fetching player:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch player' });
  }
});

// ===== ADMIN ROUTES =====

app.post('/api/admin/matches', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin role required.' });
    }
    const matchData = req.body;
    const required = ['league', 'homeTeam', 'awayTeam', 'homeOdds', 'awayOdds', 'kickoff'];
    for (const field of required) {
      if (!matchData[field]) {
        return res.status(400).json({ success: false, message: `Missing required field: ${field}` });
      }
    }
    const match = await Match.create(matchData);
    const admin = await User.findById(req.user._id);
    admin.logActivity('CREATE_MATCH', req, { matchId: match._id });
    await admin.save();
    res.json({ success: true, message: 'Match created successfully', data: match });
  } catch (error) {
    console.error('Create match error:', error);
    res.status(500).json({ success: false, message: 'Failed to create match' });
  }
});

app.put('/api/admin/matches/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin role required.' });
    }
    const match = await Match.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

    io.to(`match-${match._id}`).emit('match-updated', {
      matchId: match._id,
      updates: req.body,
      timestamp: new Date(),
    });

    const admin = await User.findById(req.user._id);
    admin.logActivity('UPDATE_MATCH', req, { matchId: match._id, updates: req.body });
    await admin.save();
    res.json({ success: true, message: 'Match updated successfully', data: match });
  } catch (error) {
    console.error('Update match error:', error);
    res.status(500).json({ success: false, message: 'Failed to update match' });
  }
});

app.delete('/api/admin/matches/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin role required.' });
    }
    const match = await Match.findByIdAndDelete(req.params.id);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
    const admin = await User.findById(req.user._id);
    admin.logActivity('DELETE_MATCH', req, { matchId: req.params.id });
    await admin.save();
    res.json({ success: true, message: 'Match deleted successfully' });
  } catch (error) {
    console.error('Delete match error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete match' });
  }
});

app.get('/api/admin/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin role required.' });
    }
    const { limit = 50, page = 1, search } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const users = await User.find(filter).select('-password -emailVerificationToken -resetPasswordToken -devices').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
    const total = await User.countDocuments(filter);
    res.json({ success: true, data: users, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

app.put('/api/admin/users/:id/status', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin role required.' });
    }
    const { isActive, isBlocked, isVerified, role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive, isBlocked, isVerified, role },
      { new: true }
    ).select('-password -emailVerificationToken -resetPasswordToken -devices');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const admin = await User.findById(req.user._id);
    admin.logActivity('UPDATE_USER_STATUS', req, { userId: req.params.id, status: { isActive, isBlocked, isVerified, role } });
    await admin.save();
    res.json({ success: true, message: 'User status updated successfully', data: user });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update user status' });
  }
});

// ===== AUTO SETTLE BETS =====
app.post('/api/admin/matches/:id/settle', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin role required.' });
    }

    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    if (match.status !== 'FINISHED') {
      return res.status(400).json({ success: false, message: 'Match must be FINISHED to settle bets' });
    }

    const pendingBets = await Bet.find({
      match: match._id,
      status: 'PENDING'
    }).populate('user');

    if (pendingBets.length === 0) {
      return res.json({
        success: true,
        message: 'No pending bets to settle',
        data: { settledCount: 0, totalWinnings: 0 }
      });
    }

    let settledCount = 0;
    let totalWinnings = 0;
    let results = [];

    for (const bet of pendingBets) {
      let isWin = false;
      const homeScore = match.homeScore;
      const awayScore = match.awayScore;

      switch (bet.selection) {
        case '1':
          isWin = homeScore > awayScore;
          break;
        case 'X':
          isWin = homeScore === awayScore;
          break;
        case '2':
          isWin = homeScore < awayScore;
          break;
        case '1X':
          isWin = homeScore >= awayScore;
          break;
        case '12':
          isWin = homeScore !== awayScore;
          break;
        case 'X2':
          isWin = homeScore <= awayScore;
          break;
        case 'Yes':
          isWin = homeScore > 0 && awayScore > 0;
          break;
        case 'No':
          isWin = homeScore === 0 || awayScore === 0;
          break;
        default:
          isWin = false;
      }

      bet.status = isWin ? 'WON' : 'LOST';
      bet.settledAt = new Date();
      bet.settledBy = req.user._id;
      await bet.save();

      results.push({
        betId: bet._id,
        user: bet.user.username,
        selection: bet.selection,
        isWin,
        amount: bet.amount,
        potentialWin: bet.potentialWin
      });

      if (isWin) {
        const user = await User.findById(bet.user._id);
        const balanceBefore = user.balance;
        const balanceAfter = user.balance + bet.potentialWin;
        user.balance = balanceAfter;
        await user.save();

        await Transaction.create({
          user: user._id,
          type: 'WINNING',
          amount: bet.potentialWin,
          balanceBefore,
          balanceAfter,
          reference: bet._id.toString(),
          description: `Bet won on ${match.homeTeam} vs ${match.awayTeam} - ${bet.selection}`,
          status: 'COMPLETED',
        });

        totalWinnings += bet.potentialWin;
        settledCount++;
      } else {
        settledCount++;
      }
    }

    io.to(`match-${match._id}`).emit('bets-settled', {
      matchId: match._id,
      settledCount,
      totalWinnings,
      results,
      timestamp: new Date(),
    });

    res.json({
      success: true,
      message: `✅ ${settledCount} bets settled automatically!`,
      data: {
        settledCount,
        totalWinnings,
        results,
        match: match.homeTeam + ' vs ' + match.awayTeam,
      },
    });

  } catch (error) {
    console.error('Auto-settle error:', error);
    res.status(500).json({ success: false, message: 'Failed to settle bets' });
  }
});

// ===== ADMIN BET ROUTES =====
app.get('/api/admin/bets', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin role required.' });
    }
    const bets = await Bet.find()
      .populate('user', 'username email')
      .populate('match', 'homeTeam awayTeam homeScore awayScore status')
      .sort({ placedAt: -1 });
    res.json({ success: true, data: bets });
  } catch (error) {
    console.error('Error fetching bets:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bets' });
  }
});

// ===== ANALYTICS ROUTES =====

app.get('/api/admin/analytics', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin role required.' });
    }

    const { period = 'week' } = req.query;
    
    const now = new Date();
    let startDate = new Date();
    switch(period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
      default:
        startDate = new Date('2000-01-01');
        break;
    }

    const totalUsers = await User.countDocuments({});
    const newUsers = await User.countDocuments({ createdAt: { $gte: startDate } });
    const activeUsers = await User.countDocuments({ 
      lastLogin: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
    });

    const totalBets = await Bet.countDocuments({});
    const pendingBets = await Bet.countDocuments({ status: 'PENDING' });
    const wonBets = await Bet.countDocuments({ status: 'WON' });
    const lostBets = await Bet.countDocuments({ status: 'LOST' });
    const periodBets = await Bet.countDocuments({ placedAt: { $gte: startDate } });

    const deposits = await Transaction.aggregate([
      { $match: { type: 'DEPOSIT', status: 'COMPLETED', createdAt: { $gte: startDate } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const withdrawals = await Transaction.aggregate([
      { $match: { type: 'WITHDRAW', status: 'COMPLETED', createdAt: { $gte: startDate } } },
      { $group: { _id: null, total: { $sum: { $multiply: ['$amount', -1] } } } }
    ]);
    const winnings = await Transaction.aggregate([
      { $match: { type: 'WINNING', status: 'COMPLETED', createdAt: { $gte: startDate } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalDeposits = deposits[0]?.total || 0;
    const totalWithdrawals = Math.abs(withdrawals[0]?.total || 0);
    const totalWinnings = winnings[0]?.total || 0;
    const profit = totalDeposits - totalWithdrawals - totalWinnings;

    const games = await Bet.aggregate([
      { $match: { placedAt: { $gte: startDate } } },
      { $group: { _id: '$selection', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const recentActivity = await Transaction.find({ createdAt: { $gte: startDate } })
      .populate('user', 'username')
      .sort({ createdAt: -1 })
      .limit(20);

    const formattedActivity = recentActivity.map(tx => ({
      type: tx.type.toLowerCase(),
      message: `${tx.user?.username || 'User'} ${tx.type.toLowerCase()} ${tx.amount > 0 ? 'deposited' : 'withdrew'} ${Math.abs(tx.amount)} ETB`,
      amount: tx.amount,
      timestamp: tx.createdAt
    }));

    const topUsers = await Bet.aggregate([
      { $match: { status: 'WON', placedAt: { $gte: startDate } } },
      { $group: { 
        _id: '$user', 
        totalWon: { $sum: '$potentialWin' },
        bets: { $sum: 1 }
      } },
      { $sort: { totalWon: -1 } },
      { $limit: 10 }
    ]);

    const topUsersData = await Promise.all(topUsers.map(async (u) => {
      const user = await User.findById(u._id).select('username');
      const totalBetsCount = await Bet.countDocuments({ user: u._id });
      const wonBetsCount = await Bet.countDocuments({ user: u._id, status: 'WON' });
      return {
        username: user?.username || 'Unknown',
        totalWon: u.totalWon,
        bets: u.bets,
        winRate: totalBetsCount > 0 ? ((wonBetsCount / totalBetsCount) * 100).toFixed(1) : 0
      };
    }));

    res.json({
      success: true,
      data: {
        users: { total: totalUsers, new: newUsers, active: activeUsers },
        bets: { total: totalBets, pending: pendingBets, won: wonBets, lost: lostBets, period: periodBets },
        revenue: { total: totalDeposits, deposits: totalDeposits, withdrawals: totalWithdrawals, profit: profit },
        games: { total: periodBets || 0, popular: games.map(g => ({ name: g._id, count: g.count })) }
      },
      recentActivity: formattedActivity,
      topUsers: topUsersData
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
});

app.get('/api/admin/analytics/export', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin role required.' });
    }

    const bets = await Bet.find()
      .populate('user', 'username email')
      .populate('match', 'homeTeam awayTeam')
      .sort({ placedAt: -1 });

    let csv = 'Date,User,Match,Selection,Odds,Stake,Potential Win,Status\n';
    bets.forEach(bet => {
      csv += `${new Date(bet.placedAt).toISOString().split('T')[0]},`;
      csv += `${bet.user?.username || 'Unknown'},`;
      csv += `${bet.match?.homeTeam || 'Unknown'} vs ${bet.match?.awayTeam || 'Unknown'},`;
      csv += `${bet.selection},`;
      csv += `${bet.odds},`;
      csv += `${bet.amount},`;
      csv += `${bet.potentialWin},`;
      csv += `${bet.status}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=analytics-report-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ success: false, message: 'Failed to export report' });
  }
});

// ===== TRANSACTION ROUTES =====

app.get('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const { type, status, limit = 50, page = 1 } = req.query;
    const filter = { user: req.user._id };
    if (type) filter.type = type;
    if (status) filter.status = status;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const transactions = await Transaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
    const total = await Transaction.countDocuments(filter);
    res.json({ success: true, data: transactions, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    console.error('Transactions error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch transactions' });
  }
});

// ===== BET SLIP ROUTES =====

app.post('/api/betslip', authenticateToken, async (req, res) => {
  try {
    const { bets, totalOdds, totalStake, potentialWin } = req.body;
    let betSlip = await BetSlip.findOne({ user: req.user._id, status: 'ACTIVE' });
    if (betSlip) {
      betSlip.bets = bets;
      betSlip.totalOdds = totalOdds;
      betSlip.totalStake = totalStake;
      betSlip.potentialWin = potentialWin;
      betSlip.updatedAt = new Date();
      await betSlip.save();
    } else {
      betSlip = await BetSlip.create({ user: req.user._id, bets, totalOdds, totalStake, potentialWin, status: 'ACTIVE' });
    }
    res.json({ success: true, data: betSlip });
  } catch (error) {
    console.error('Bet slip error:', error);
    res.status(500).json({ success: false, message: 'Failed to save bet slip' });
  }
});

app.get('/api/betslip', authenticateToken, async (req, res) => {
  try {
    const betSlip = await BetSlip.findOne({ user: req.user._id, status: 'ACTIVE' }).populate('bets.match');
    res.json({ success: true, data: betSlip || null });
  } catch (error) {
    console.error('Get bet slip error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bet slip' });
  }
});

app.delete('/api/betslip', authenticateToken, async (req, res) => {
  try {
    await BetSlip.findOneAndDelete({ user: req.user._id, status: 'ACTIVE' });
    res.json({ success: true, message: 'Bet slip cleared successfully' });
  } catch (error) {
    console.error('Clear bet slip error:', error);
    res.status(500).json({ success: false, message: 'Failed to clear bet slip' });
  }
});

// ===== 404 =====
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found', path: req.originalUrl });
});

// ===== ERROR HANDLER =====
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ success: false, message: 'Validation error', errors });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({ success: false, message: `${field} already exists`, field });
  }
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🚀 Mika-Bet Backend is running!`);
    console.log(`${'='.repeat(50)}`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🍃 MongoDB: Connected`);
    console.log(`🔌 WebSocket: Active on /socket.io`);
    console.log(`${'='.repeat(50)}\n`);
  });
}).catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  httpServer.close(() => {
    console.log('✅ Server closed');
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received. Shutting down gracefully...');
  httpServer.close(() => {
    console.log('✅ Server closed');
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });
});

export { io };