import mongoose from 'mongoose';

const withdrawalRequestSchema = new mongoose.Schema({
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  playerType: {
    type: String,
    enum: ['player', 'agent', 'superagent'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 1,
  },
  status: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'PAYMENT_SENT', 'COMPLETED', 'REJECTED'],
    default: 'PENDING',
  },
  handlerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  handlerType: {
    type: String,
    enum: ['agent', 'superagent', 'admin'],
    default: null,
  },
  handlerBankInfo: {
    bankName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    accountHolder: { type: String, default: '' },
  },
  hierarchy: {
    agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    superagentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  rejectedReason: {
    type: String,
    default: '',
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
  acceptedAt: {
    type: Date,
    default: null,
  },
  completedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

withdrawalRequestSchema.index({ status: 1 });
withdrawalRequestSchema.index({ playerId: 1, status: 1 });
withdrawalRequestSchema.index({ handlerId: 1, status: 1 });

const WithdrawalRequest = mongoose.model('WithdrawalRequest', withdrawalRequestSchema);

export default WithdrawalRequest;