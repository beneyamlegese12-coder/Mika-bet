import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
  },
  firstName: {
    type: String,
    trim: true,
    default: '',
  },
  lastName: {
    type: String,
    trim: true,
    default: '',
  },
  dateOfBirth: {
    type: Date,
  },
  role: {
    type: String,
    enum: ['admin', 'superagent', 'agent', 'player'],
    default: 'player',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isVerified: {
    type: Boolean,
    default: true,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  balance: {
    type: Number,
    default: 100,
    min: 0,
  },
  currency: {
    type: String,
    default: 'ETB',
  },
  referralCode: {
    type: String,
    unique: true,
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  referralCount: {
    type: Number,
    default: 0,
  },
  lastLogin: {
    type: Date,
    default: null,
  },
  loginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: {
    type: Date,
    default: null,
  },
  devices: [{
    deviceId: String,
    deviceName: String,
    ip: String,
    userAgent: String,
    lastUsed: Date,
    refreshToken: String,
  }],
  activityLog: [{
    action: String,
    timestamp: Date,
    ip: String,
    userAgent: String,
    details: mongoose.Schema.Types.Mixed,
  }],
  preferences: {
    language: {
      type: String,
      default: 'en',
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'dark',
    },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true },
    },
    oddsFormat: {
      type: String,
      enum: ['decimal', 'fractional', 'american'],
      default: 'decimal',
    },
  },
  sessionToken: {
    type: String,
    default: null,
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
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ referralCode: 1 });

// Pre-save hooks
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.pre('save', async function(next) {
  if (!this.isNew || this.referralCode) return next();
  this.referralCode = await this.constructor.generateReferralCode();
  next();
});

// Static methods
userSchema.statics.generateUsername = async function(base) {
  let username = base.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!username) username = 'user';
  username = username.substring(0, 15);
  let exists = await this.findOne({ username });
  let counter = 1;
  while (exists) {
    const newUsername = `${username}${counter}`;
    exists = await this.findOne({ username: newUsername });
    if (!exists) {
      username = newUsername;
      break;
    }
    counter++;
  }
  return username;
};

userSchema.statics.generateReferralCode = async function() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code;
  let exists;
  let attempts = 0;
  do {
    code = '';
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    exists = await this.findOne({ referralCode: code });
    attempts++;
  } while (exists && attempts < 100);
  return code;
};

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { 
      id: this._id, 
      username: this.username,
      email: this.email,
      role: this.role || 'player',
      isVerified: this.isVerified,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

userSchema.methods.generateRefreshToken = function() {
  return jwt.sign(
    { id: this._id },
    process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

userSchema.methods.logActivity = function(action, req, details = {}) {
  this.activityLog.push({
    action,
    timestamp: new Date(),
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.headers?.['user-agent'] || 'Unknown',
    details,
  });
  if (this.activityLog.length > 100) {
    this.activityLog = this.activityLog.slice(-100);
  }
};

userSchema.methods.isLocked = function() {
  if (!this.lockUntil) return false;
  return this.lockUntil > Date.now();
};

userSchema.methods.incrementLoginAttempts = async function() {
  this.loginAttempts += 1;
  if (this.loginAttempts >= 5) {
    this.lockUntil = Date.now() + 30 * 60 * 1000;
  }
  await this.save();
};

userSchema.methods.resetLoginAttempts = async function() {
  this.loginAttempts = 0;
  this.lockUntil = null;
  await this.save();
};

userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
};

userSchema.methods.updateSessionToken = function() {
  this.sessionToken = crypto.randomBytes(32).toString('hex');
  return this.sessionToken;
};

const User = mongoose.model('User', userSchema);

export default User;