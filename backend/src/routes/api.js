// backend/src/routes/api.js
import express from 'express';
import authRoutes from './authRoutes.js';
import betRoutes from './betRoutes.js';
import matchRoutes from './matchRoutes.js';
import walletRoutes from './walletRoutes.js';
import gameRoutes from './gameRoutes.js';
import adminRoutes from './adminRoutes.js';

const router = express.Router();

// Public routes
router.use('/auth', authRoutes);
router.use('/matches', matchRoutes);
router.use('/games', gameRoutes);

// Protected routes
router.use('/bets', betRoutes);
router.use('/wallet', walletRoutes);
router.use('/admin', adminRoutes);

export default router;