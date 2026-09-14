import mongoose from 'mongoose';

const depositRequestSchema = new mongoose.Schema({
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
    sentAt: { type: Date, default: null },
  },
  requesterPaymentInfo: {
    senderName: { type: String, default: '' },
    referenceNumber: { type: String, default: '' },
    submittedAt: { type: Date, default: null },
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

// Indexes
depositRequestSchema.index({ status: 1 });
depositRequestSchema.index({ playerId: 1, status: 1 });
depositRequestSchema.index({ handlerId: 1, status: 1 });

const DepositRequest = mongoose.model('DepositRequest', depositRequestSchema);

export default DepositRequest;