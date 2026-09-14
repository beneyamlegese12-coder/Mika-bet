import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import User from '../models/User.js';
import DepositRequest from '../models/DepositRequest.js';
import WithdrawalRequest from '../models/WithdrawalRequest.js';
import Transaction from '../models/Transaction.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// ============================================================
// ADMIN ROUTES
// ============================================================

// ===== ADMIN: Create Agent/SuperAgent =====
router.post('/admin/create-agent', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { username, email, phone, password, role, balance } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username, email and password are required' 
      });
    }

    const existing = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists with this email or username' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      phone: phone || undefined,
      password: hashedPassword,
      role: role || 'agent',
      balance: balance || 0,
      isVerified: true,
      isActive: true,
      createdBy: req.user._id,
    });

    res.json({
      success: true,
      message: `${role} created successfully`,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        balance: user.balance,
      },
    });
  } catch (error) {
    console.error('Create agent error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// ============================================================
// REQUEST QUERY ROUTES
// ============================================================

// ===== GET PENDING REQUESTS =====
router.get('/requests/pending', authenticateToken, async (req, res) => {
  try {
    console.log('📋 Fetching pending requests for:', req.user.email);
    const user = req.user;
    let requests = [];

    if (user.role === 'admin') {
      requests = await DepositRequest.find({
        status: 'PENDING',
        playerType: 'superagent',
      }).populate('playerId', 'username email');
    } else if (user.role === 'superagent') {
      requests = await DepositRequest.find({
        status: 'PENDING',
        playerType: 'agent',
      }).populate('playerId', 'username email');
    } else if (user.role === 'agent') {
      requests = await DepositRequest.find({
        status: 'PENDING',
        playerType: 'player',
      }).populate('playerId', 'username email');
    }

    console.log(`✅ Found ${requests.length} pending requests`);
    res.json({ success: true, data: requests });
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch requests' });
  }
});

// ===== PLAYER DEPOSITS =====
router.get('/player/deposits', authenticateToken, async (req, res) => {
  try {
    const requests = await DepositRequest.find({
      playerId: req.user._id,
    }).populate('handlerId', 'username email phone')
      .sort({ requestedAt: -1 });
    res.json({ success: true, data: requests });
  } catch (error) {
    console.error('Error fetching player deposits:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch deposits' });
  }
});

// ===== PLAYER WITHDRAWALS =====
router.get('/player/withdrawals', authenticateToken, async (req, res) => {
  try {
    const requests = await WithdrawalRequest.find({
      playerId: req.user._id,
    }).populate('handlerId', 'username email phone')
      .sort({ requestedAt: -1 });
    res.json({ success: true, data: requests });
  } catch (error) {
    console.error('Error fetching player withdrawals:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch withdrawals' });
  }
});

// ===== AGENT DEPOSITS (Incoming + Outgoing) =====
router.get('/agent/deposits', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    console.log('📋 Agent deposits request for:', user.email, 'Role:', user.role);
    
    let filter = {};

    if (user.role === 'admin') {
      filter = {
        $or: [
          { playerType: 'superagent' },
          { handlerId: user._id }
        ]
      };
    } else if (user.role === 'superagent') {
      filter = {
        $or: [
          { playerType: 'agent' },
          { playerId: user._id }
        ]
      };
    } else if (user.role === 'agent') {
      filter = {
        $or: [
          { playerType: 'player' },
          { playerId: user._id }
        ]
      };
    } else {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const requests = await DepositRequest.find(filter)
      .populate('playerId', 'username email phone')
      .populate('handlerId', 'username email phone')
      .sort({ requestedAt: -1 });
    
    console.log(`✅ Found ${requests.length} deposit requests`);
    res.json({ success: true, data: requests });
  } catch (error) {
    console.error('Error fetching agent deposits:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch deposits' });
  }
});

// ===== AGENT WITHDRAWALS (Incoming + Outgoing) =====
router.get('/agent/withdrawals', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    let filter = {};

    if (user.role === 'admin') {
      filter = {
        $or: [
          { playerType: 'superagent' },
          { handlerId: user._id }
        ]
      };
    } else if (user.role === 'superagent') {
      filter = {
        $or: [
          { playerType: 'agent' },
          { playerId: user._id }
        ]
      };
    } else if (user.role === 'agent') {
      filter = {
        $or: [
          { playerType: 'player' },
          { playerId: user._id }
        ]
      };
    } else {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const requests = await WithdrawalRequest.find(filter)
      .populate('playerId', 'username email phone')
      .populate('handlerId', 'username email phone')
      .sort({ requestedAt: -1 });
    res.json({ success: true, data: requests });
  } catch (error) {
    console.error('Error fetching agent withdrawals:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch withdrawals' });
  }
});

// ============================================================
// DEPOSIT ROUTES
// ============================================================

// ===== DEPOSIT REQUEST =====
router.post('/deposit/request', authenticateToken, async (req, res) => {
  try {
    console.log('📥 === DEPOSIT REQUEST ===');
    console.log('📦 Body:', req.body);
    
    let amount = req.body.amount;
    if (typeof amount === 'string') {
      amount = parseFloat(amount);
    }
    
    console.log('💰 Parsed amount:', amount);
    
    if (!amount || isNaN(amount) || amount < 1) {
      console.log('❌ Invalid amount:', amount);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid amount. Minimum deposit is 1 ETB.',
        received: req.body 
      });
    }

    const user = req.user;
    console.log('👤 User:', user.email);
    console.log('👤 User Role:', user.role);

    let handlerType = null;
    let hierarchy = {
      agentId: null,
      superagentId: null,
      adminId: null,
    };

    if (user.role === 'player') {
      handlerType = 'agent';
      hierarchy.agentId = user._id;
    } else if (user.role === 'agent') {
      handlerType = 'superagent';
      hierarchy.agentId = user._id;
      hierarchy.superagentId = user._id;
    } else if (user.role === 'superagent') {
      handlerType = 'admin';
      hierarchy.superagentId = user._id;
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid role for deposit request' 
      });
    }

    const request = await DepositRequest.create({
      playerId: user._id,
      playerType: user.role,
      amount: amount,
      status: 'PENDING',
      handlerType,
      hierarchy,
    });

    console.log('✅ Deposit request created:', request._id);

    const io = req.app.get('io');
    if (io) {
      io.emit('new-deposit-request', {
        requestId: request._id,
        playerType: user.role,
        amount: amount,
        handlerType,
      });
    }

    res.json({
      success: true,
      message: 'Deposit request submitted',
      data: request,
    });
  } catch (error) {
    console.error('❌ Deposit request error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to submit request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// ===== ACCEPT DEPOSIT REQUEST =====
router.post('/requests/:id/accept', authenticateToken, async (req, res) => {
  try {
    console.log('📥 === ACCEPT DEPOSIT ===');
    console.log('📦 Request ID:', req.params.id);
    console.log('👤 User:', req.user.email);
    console.log('👤 Role:', req.user.role);
    
    const request = await DepositRequest.findById(req.params.id);
    if (!request) {
      console.log('❌ Request not found');
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    console.log('📋 Request found:');
    console.log('   Player Type:', request.playerType);
    console.log('   Amount:', request.amount);
    console.log('   Status:', request.status);

    if (request.status !== 'PENDING') {
      console.log('❌ Request already processed:', request.status);
      return res.status(400).json({ success: false, message: 'Request already processed' });
    }

    const user = req.user;
    
    if (request.playerType === 'player' && user.role !== 'agent') {
      return res.status(403).json({ success: false, message: 'Only agents can accept player requests' });
    }
    if (request.playerType === 'agent' && user.role !== 'superagent') {
      return res.status(403).json({ success: false, message: 'Only superagents can accept agent requests' });
    }
    if (request.playerType === 'superagent' && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can accept superagent requests' });
    }

    request.status = 'PROCESSING';
    request.handlerId = user._id;
    request.handlerType = user.role;
    request.acceptedAt = new Date();
    await request.save();

    console.log('✅ Request accepted by:', user.email);

    const agent = await User.findById(user._id).select('username email phone');

    const io = req.app.get('io');
    io.to(`user-${request.playerId}`).emit('deposit-accepted', {
      requestId: request._id,
      status: 'PROCESSING',
      handlerId: user._id,
      agentInfo: {
        username: agent.username,
        email: agent.email,
        phone: agent.phone || 'N/A',
      },
    });

    res.json({
      success: true,
      message: 'Request accepted',
      data: request,
    });
  } catch (error) {
    console.error('❌ Accept error:', error);
    res.status(500).json({ success: false, message: 'Failed to accept request' });
  }
});

// ===== SEND BANK INFO (Handler to Requester) =====
router.post('/requests/:id/bank-info', authenticateToken, async (req, res) => {
  try {
    console.log('📥 === SEND BANK INFO ===');
    console.log('📦 Request ID:', req.params.id);
    console.log('👤 User:', req.user.email);
    
    const { bankName, accountNumber, accountHolder } = req.body;
    const request = await DepositRequest.findById(req.params.id);

    if (!request) {
      console.log('❌ Request not found');
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.handlerId.toString() !== req.user._id.toString()) {
      console.log('❌ Not authorized');
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    request.handlerBankInfo = {
      bankName,
      accountNumber,
      accountHolder,
      sentAt: new Date(),
    };
    await request.save();

    console.log('✅ Bank info sent to:', request.playerId);

    const io = req.app.get('io');
    io.to(`user-${request.playerId}`).emit('bank-info-sent', {
      requestId: request._id,
      bankInfo: request.handlerBankInfo,
    });

    res.json({
      success: true,
      message: 'Bank info sent to requester',
      data: request.handlerBankInfo,
    });
  } catch (error) {
    console.error('❌ Bank info error:', error);
    res.status(500).json({ success: false, message: 'Failed to send bank info' });
  }
});

// ===== SUBMIT PAYMENT (Requester to Handler) =====
router.post('/deposit/:id/payment-info', authenticateToken, async (req, res) => {
  try {
    console.log('📥 === SUBMIT PAYMENT ===');
    console.log('📦 Request ID:', req.params.id);
    console.log('👤 User:', req.user.email);
    console.log('👤 User ID:', req.user._id);
    
    const { senderName, referenceNumber } = req.body;
    const request = await DepositRequest.findById(req.params.id);

    if (!request) {
      console.log('❌ Request not found');
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    console.log('📋 Request found:');
    console.log('   Player ID:', request.playerId);
    console.log('   Status:', request.status);
    console.log('   Amount:', request.amount);

    const requestPlayerId = request.playerId._id?.toString() || request.playerId?.toString();
    const userId = req.user._id.toString();

    console.log('🔍 Comparing IDs:');
    console.log('   Request Player ID:', requestPlayerId);
    console.log('   User ID:', userId);
    console.log('   Match:', requestPlayerId === userId);

    if (requestPlayerId !== userId) {
      console.log('❌ Not authorized - user is not the requester');
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to submit payment for this request' 
      });
    }

    if (request.status !== 'PROCESSING') {
      console.log('❌ Invalid status:', request.status);
      return res.status(400).json({ 
        success: false, 
        message: `Request status is ${request.status}, cannot submit payment. Must be PROCESSING` 
      });
    }

    request.requesterPaymentInfo = {
      senderName,
      referenceNumber,
      submittedAt: new Date(),
    };
    request.status = 'PAYMENT_SENT';
    await request.save();

    console.log('✅ Payment info submitted successfully');

    const io = req.app.get('io');
    if (io) {
      io.to(`user-${request.handlerId}`).emit('payment-submitted', {
        requestId: request._id,
        paymentInfo: request.requesterPaymentInfo,
      });
      console.log('📡 WebSocket event emitted');
    }

    res.json({
      success: true,
      message: 'Payment info submitted',
      data: request.requesterPaymentInfo,
    });
  } catch (error) {
    console.error('❌ Payment info error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to submit payment info',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// ===== COMPLETE DEPOSIT (Handler verifies and tops up) =====
router.post('/requests/:id/complete', authenticateToken, async (req, res) => {
  try {
    console.log('📥 === COMPLETE DEPOSIT ===');
    console.log('📦 Request ID:', req.params.id);
    console.log('👤 User:', req.user.email);
    console.log('👤 Role:', req.user.role);
    
    const request = await DepositRequest.findById(req.params.id);
    if (!request) {
      console.log('❌ Request not found');
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    console.log('📋 Request found:');
    console.log('   Status:', request.status);
    console.log('   Amount:', request.amount);
    console.log('   Player:', request.playerId);
    console.log('   Handler:', request.handlerId);

    const isHandler = request.handlerId && request.handlerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    console.log('🔍 Authorization check:');
    console.log('   isHandler:', isHandler);
    console.log('   isAdmin:', isAdmin);
    
    if (!isHandler && !isAdmin) {
      console.log('❌ Not authorized');
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to complete this request' 
      });
    }

    if (request.status !== 'PAYMENT_SENT') {
      console.log('❌ Invalid status:', request.status);
      return res.status(400).json({ 
        success: false, 
        message: `Request status is ${request.status}, cannot complete. Must be PAYMENT_SENT` 
      });
    }

    // 1. ADD TO REQUESTER
    const requester = await User.findById(request.playerId);
    const requesterBalanceBefore = requester.balance;
    requester.balance += request.amount;
    await requester.save();

    // 2. DEDUCT FROM HANDLER
    const handler = await User.findById(request.handlerId);
    if (handler) {
      const handlerBalanceBefore = handler.balance;
      handler.balance -= request.amount;
      await handler.save();
      
      await Transaction.create({
        user: handler._id,
        type: 'WITHDRAW',
        amount: -request.amount,
        balanceBefore: handlerBalanceBefore,
        balanceAfter: handler.balance,
        reference: request._id.toString(),
        description: `Deposit payout to ${requester.email}`,
        status: 'COMPLETED',
      });
    }

    // 3. TRANSACTION FOR REQUESTER
    await Transaction.create({
      user: requester._id,
      type: 'DEPOSIT',
      amount: request.amount,
      balanceBefore: requesterBalanceBefore,
      balanceAfter: requester.balance,
      reference: request._id.toString(),
      description: `Deposit via ${req.user.role}`,
      status: 'COMPLETED',
    });

    request.status = 'COMPLETED';
    request.completedAt = new Date();
    await request.save();

    console.log('✅ Deposit completed successfully!');

    const io = req.app.get('io');
    if (io) {
      io.to(`user-${request.playerId}`).emit('deposit-completed', {
        requestId: request._id,
        newBalance: requester.balance,
      });
    }

    res.json({
      success: true,
      message: 'Deposit completed successfully',
      data: {
        request,
        requesterBalance: requester.balance,
        handlerBalance: handler ? handler.balance : null,
      },
    });
  } catch (error) {
    console.error('❌ Complete deposit error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to complete deposit',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// ===== REJECT DEPOSIT =====
router.post('/requests/:id/reject', authenticateToken, async (req, res) => {
  try {
    const { reason } = req.body;
    const request = await DepositRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'Request already processed' });
    }

    request.status = 'REJECTED';
    request.rejectedReason = reason || 'No reason provided';
    await request.save();

    const io = req.app.get('io');
    io.to(`user-${request.playerId}`).emit('deposit-rejected', {
      requestId: request._id,
      reason: request.rejectedReason,
    });

    res.json({
      success: true,
      message: 'Request rejected',
      data: request,
    });
  } catch (error) {
    console.error('Reject error:', error);
    res.status(500).json({ success: false, message: 'Failed to reject request' });
  }
});

// ===== SINGLE DEPOSIT REQUEST =====
router.get('/deposit/request/:id', authenticateToken, async (req, res) => {
  try {
    const request = await DepositRequest.findById(req.params.id)
      .populate('handlerId', 'username email phone')
      .populate('playerId', 'username email phone');
    
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    
    const requestPlayerId = request.playerId._id?.toString() || request.playerId?.toString();
    const userId = req.user._id.toString();
    const handlerId = request.handlerId?._id?.toString() || request.handlerId?.toString();
    
    if (requestPlayerId !== userId && handlerId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    res.json({ success: true, data: request });
  } catch (error) {
    console.error('Get request error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch request' });
  }
});

// ===== CANCEL DEPOSIT =====
router.delete('/deposit/request/:id', authenticateToken, async (req, res) => {
  try {
    const request = await DepositRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.playerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'Request already processed' });
    }

    await DepositRequest.findByIdAndDelete(req.params.id);

    const io = req.app.get('io');
    io.emit('deposit-cancelled', {
      requestId: req.params.id,
    });

    res.json({
      success: true,
      message: 'Deposit request cancelled',
    });
  } catch (error) {
    console.error('Cancel deposit error:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel deposit' });
  }
});

// ============================================================
// WITHDRAWAL ROUTES
// ============================================================

// ===== WITHDRAWAL REQUEST =====
router.post('/withdraw/request', authenticateToken, async (req, res) => {
  try {
    console.log('📥 === WITHDRAWAL REQUEST ===');
    console.log('📦 Body:', req.body);
    
    let amount = req.body.amount;
    if (typeof amount === 'string') {
      amount = parseFloat(amount);
    }
    
    console.log('💰 Parsed amount:', amount);
    
    if (!amount || isNaN(amount) || amount < 1) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid amount' 
      });
    }

    const user = req.user;
    console.log('👤 User:', user.email);
    console.log('💰 Balance:', user.balance);

    if (amount > user.balance) {
      return res.status(400).json({ 
        success: false, 
        message: 'Insufficient balance' 
      });
    }

    const { bankInfo } = req.body;

    if (!bankInfo || !bankInfo.bankName || !bankInfo.accountNumber || !bankInfo.accountHolder) {
      return res.status(400).json({ 
        success: false, 
        message: 'Bank information is required for withdrawal' 
      });
    }

    let handlerType = null;
    let hierarchy = {
      agentId: null,
      superagentId: null,
      adminId: null,
    };

    if (user.role === 'player') {
      handlerType = 'agent';
      hierarchy.agentId = user._id;
    } else if (user.role === 'agent') {
      handlerType = 'superagent';
      hierarchy.agentId = user._id;
      hierarchy.superagentId = user._id;
    } else if (user.role === 'superagent') {
      handlerType = 'admin';
      hierarchy.superagentId = user._id;
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid role for withdrawal request' 
      });
    }

    const request = await WithdrawalRequest.create({
      playerId: user._id,
      playerType: user.role,
      amount: amount,
      requesterBankInfo: bankInfo,
      status: 'PENDING',
      handlerType,
      hierarchy,
    });

    console.log('✅ Withdrawal request created:', request._id);

    const io = req.app.get('io');
    io.emit('new-withdrawal-request', {
      requestId: request._id,
      playerType: user.role,
      amount: amount,
      handlerType,
    });

    res.json({
      success: true,
      message: 'Withdrawal request submitted',
      data: request,
    });
  } catch (error) {
    console.error('❌ Withdrawal request error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to submit withdrawal request' 
    });
  }
});

// ===== SINGLE WITHDRAWAL REQUEST =====
router.get('/withdraw/request/:id', authenticateToken, async (req, res) => {
  try {
    const request = await WithdrawalRequest.findById(req.params.id)
      .populate('handlerId', 'username email phone')
      .populate('playerId', 'username email phone');
    
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    
    const requestPlayerId = request.playerId._id?.toString() || request.playerId?.toString();
    const userId = req.user._id.toString();
    const handlerId = request.handlerId?._id?.toString() || request.handlerId?.toString();
    
    if (requestPlayerId !== userId && handlerId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    res.json({ success: true, data: request });
  } catch (error) {
    console.error('Get withdrawal request error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch request' });
  }
});

// ===== ACCEPT WITHDRAWAL =====
router.post('/withdraw/:id/accept', authenticateToken, async (req, res) => {
  try {
    console.log('📥 === ACCEPT WITHDRAWAL ===');
    console.log('📦 Request ID:', req.params.id);
    console.log('👤 User:', req.user.email);
    
    const request = await WithdrawalRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'Request already processed' });
    }

    const user = req.user;
    
    if (request.playerType === 'player' && user.role !== 'agent') {
      return res.status(403).json({ success: false, message: 'Only agents can accept player withdrawal requests' });
    }
    if (request.playerType === 'agent' && user.role !== 'superagent') {
      return res.status(403).json({ success: false, message: 'Only superagents can accept agent withdrawal requests' });
    }
    if (request.playerType === 'superagent' && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can accept superagent withdrawal requests' });
    }

    const handler = await User.findById(user._id);
    if (!handler) {
      return res.status(404).json({ success: false, message: 'Handler not found' });
    }

    if (handler.balance < request.amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Handler does not have enough balance' 
      });
    }

    request.status = 'PROCESSING';
    request.handlerId = user._id;
    request.handlerType = user.role;
    request.acceptedAt = new Date();
    await request.save();

    console.log('✅ Withdrawal accepted by:', user.email);

    const io = req.app.get('io');
    io.to(`user-${request.playerId}`).emit('withdraw-accepted', {
      requestId: request._id,
      status: 'PROCESSING',
      handlerId: user._id,
      handlerInfo: {
        username: handler.username,
        email: handler.email,
      },
    });

    res.json({
      success: true,
      message: 'Withdrawal request accepted',
      data: request,
    });
  } catch (error) {
    console.error('❌ Withdrawal accept error:', error);
    res.status(500).json({ success: false, message: 'Failed to accept withdrawal' });
  }
});

// ===== HANDLER SUBMITS PAYMENT INFO (After sending money) =====
router.post('/withdraw/:id/payment-info', authenticateToken, async (req, res) => {
  try {
    console.log('📥 === WITHDRAWAL PAYMENT INFO ===');
    console.log('📦 Request ID:', req.params.id);
    console.log('👤 User:', req.user.email);
    
    const { senderName, referenceNumber } = req.body;
    const request = await WithdrawalRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.handlerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (request.status !== 'PROCESSING') {
      return res.status(400).json({ 
        success: false, 
        message: `Request status is ${request.status}, cannot submit payment info. Must be PROCESSING` 
      });
    }

    request.handlerPaymentInfo = {
      senderName,
      referenceNumber,
      submittedAt: new Date(),
    };
    request.status = 'PAYMENT_SENT';
    await request.save();

    console.log('✅ Withdrawal payment info submitted');

    const io = req.app.get('io');
    io.to(`user-${request.playerId}`).emit('withdraw-payment-sent', {
      requestId: request._id,
      paymentInfo: request.handlerPaymentInfo,
    });

    res.json({
      success: true,
      message: 'Payment info submitted',
      data: request.handlerPaymentInfo,
    });
  } catch (error) {
    console.error('❌ Withdrawal payment info error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit payment info' });
  }
});

// ===== COMPLETE WITHDRAWAL (Requester confirms receipt) =====
router.post('/withdraw/:id/complete', authenticateToken, async (req, res) => {
  try {
    console.log('📥 === COMPLETE WITHDRAWAL ===');
    console.log('📦 Request ID:', req.params.id);
    console.log('👤 User:', req.user.email);
    console.log('👤 Role:', req.user.role);
    
    const request = await WithdrawalRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Only the requester can complete (confirm receipt)
    if (request.playerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only the requester can confirm receipt' 
      });
    }

    if (request.status !== 'PAYMENT_SENT') {
      return res.status(400).json({ 
        success: false, 
        message: `Request status is ${request.status}, cannot complete. Must be PAYMENT_SENT` 
      });
    }

    // 1. DEDUCT FROM REQUESTER (they withdrew money)
    const requester = await User.findById(request.playerId);
    const requesterBalanceBefore = requester.balance;
    requester.balance -= request.amount;
    await requester.save();

    // 2. ADD TO HANDLER (they received the money)
    const handler = await User.findById(request.handlerId);
    if (handler) {
      const handlerBalanceBefore = handler.balance;
      handler.balance += request.amount;
      await handler.save();
      
      await Transaction.create({
        user: handler._id,
        type: 'DEPOSIT',
        amount: request.amount,
        balanceBefore: handlerBalanceBefore,
        balanceAfter: handler.balance,
        reference: request._id.toString(),
        description: `Withdrawal from ${requester.email}`,
        status: 'COMPLETED',
      });
    }

    // 3. TRANSACTION FOR REQUESTER
    await Transaction.create({
      user: requester._id,
      type: 'WITHDRAW',
      amount: -request.amount,
      balanceBefore: requesterBalanceBefore,
      balanceAfter: requester.balance,
      reference: request._id.toString(),
      description: `Withdrawal to ${request.requesterBankInfo?.bankName || 'Bank'}`,
      status: 'COMPLETED',
    });

    request.status = 'COMPLETED';
    request.completedAt = new Date();
    await request.save();

    console.log('✅ Withdrawal completed successfully!');

    const io = req.app.get('io');
    io.to(`user-${request.handlerId}`).emit('withdraw-completed', {
      requestId: request._id,
      newBalance: requester.balance,
    });

    res.json({
      success: true,
      message: 'Withdrawal completed successfully',
      data: {
        request,
        requesterBalance: requester.balance,
        handlerBalance: handler ? handler.balance : null,
      },
    });
  } catch (error) {
    console.error('❌ Complete withdrawal error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to complete withdrawal',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// ===== REJECT WITHDRAWAL =====
router.post('/withdraw/:id/reject', authenticateToken, async (req, res) => {
  try {
    const { reason } = req.body;
    const request = await WithdrawalRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'Request already processed' });
    }

    request.status = 'REJECTED';
    request.rejectedReason = reason || 'No reason provided';
    await request.save();

    const io = req.app.get('io');
    io.to(`user-${request.playerId}`).emit('withdraw-rejected', {
      requestId: request._id,
      reason: request.rejectedReason,
    });

    res.json({
      success: true,
      message: 'Withdrawal request rejected',
      data: request,
    });
  } catch (error) {
    console.error('Reject withdrawal error:', error);
    res.status(500).json({ success: false, message: 'Failed to reject withdrawal' });
  }
});

// ===== CANCEL WITHDRAWAL =====
router.delete('/withdraw/request/:id', authenticateToken, async (req, res) => {
  try {
    const request = await WithdrawalRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.playerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'Request already processed' });
    }

    await WithdrawalRequest.findByIdAndDelete(req.params.id);

    const io = req.app.get('io');
    io.emit('withdraw-cancelled', {
      requestId: req.params.id,
    });

    res.json({
      success: true,
      message: 'Withdrawal request cancelled',
    });
  } catch (error) {
    console.error('Cancel withdrawal error:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel withdrawal' });
  }
});

export default router;