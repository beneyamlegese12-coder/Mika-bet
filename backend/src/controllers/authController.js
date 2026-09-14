import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Bet from '../models/Bet.js';

export const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map(err => ({
          field: err.path,
          message: err.msg,
        })),
      });
    }

    const { email, password, phone, dateOfBirth, firstName, lastName, referralCode, role } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { phone: phone || '' }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or phone',
      });
    }

    const username = await User.generateUsername(email.split('@')[0]);

    let referredBy = null;
    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      if (referrer) {
        referredBy = referrer._id;
      }
    }

    const user = new User({
      username,
      email,
      password,
      phone: phone || undefined,
      dateOfBirth: dateOfBirth || undefined,
      firstName: firstName || '',
      lastName: lastName || '',
      referredBy,
      role: role || 'player',
      isVerified: true,
      isActive: true,
    });

    await user.save();

    if (user.balance > 0) {
      await Transaction.create({
        user: user._id,
        type: 'BONUS',
        amount: user.balance,
        balanceBefore: 0,
        balanceAfter: user.balance,
        description: 'Welcome bonus',
        status: 'COMPLETED',
      });
    }

    user.logActivity('REGISTER', req, { email, phone });

    console.log(`✅ User registered: ${email} (${user.role})`);

    res.status(201).json({
      success: true,
      message: 'Registration successful! You can now login.',
      data: {
        userId: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        balance: user.balance,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map(err => ({
          field: err.path,
          message: err.msg,
        })),
      });
    }

    const { identifier, password, deviceName } = req.body;

    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { username: identifier },
        { phone: identifier },
      ],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Account has been blocked. Please contact support.',
      });
    }

    if (user.isLocked()) {
      return res.status(403).json({
        success: false,
        message: `Account is locked. Try again after ${new Date(user.lockUntil).toLocaleTimeString()}`,
      });
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      await user.incrementLoginAttempts();
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        attemptsLeft: Math.max(0, 5 - user.loginAttempts),
      });
    }

    await user.resetLoginAttempts();
    user.updateLastLogin();

    const token = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();
    user.updateSessionToken();

    const deviceInfo = {
      deviceId: crypto.randomBytes(16).toString('hex'),
      deviceName: deviceName || 'Unknown Device',
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent'] || 'Unknown',
      lastUsed: new Date(),
      refreshToken,
    };

    user.devices.push(deviceInfo);
    await user.save();

    user.logActivity('LOGIN', req, { device: deviceInfo.deviceName });

    res.json({
      success: true,
      message: 'Login successful!',
      data: {
        token,
        refreshToken,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          firstName: user.firstName,
          lastName: user.lastName,
          balance: user.balance,
          isVerified: user.isVerified,
          role: user.role || 'player',
          preferences: user.preferences,
          referralCode: user.referralCode,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required',
      });
    }

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token',
      });
    }

    user.isVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully! You can now login.',
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed',
    });
  }
};

export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified',
      });
    }

    user.isVerified = true;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully (development mode)',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send verification email',
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({
        success: true,
        message: 'If your email is registered, you will receive a password reset link',
      });
    }

    const token = user.generateResetPasswordToken();
    await user.save();

    console.log(`🔑 Password reset token for ${email}: ${token}`);

    res.json({
      success: true,
      message: 'If your email is registered, you will receive a password reset link',
      ...(process.env.NODE_ENV === 'development' && { token }),
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process request',
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully! You can now login.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
    });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required',
      });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET
    );

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }

    const device = user.devices.find(d => d.refreshToken === refreshToken);
    if (!device) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }

    const newToken = user.generateAuthToken();
    const newRefreshToken = user.generateRefreshToken();

    device.refreshToken = newRefreshToken;
    device.lastUsed = new Date();
    await user.save();

    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token',
    });
  }
};

export const logout = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { refreshToken } = req.body;

    if (refreshToken) {
      user.devices = user.devices.filter(d => d.refreshToken !== refreshToken);
    } else {
      user.devices = [];
    }

    user.sessionToken = null;
    await user.save();

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -emailVerificationToken -resetPasswordToken -devices')
      .populate('referredBy', 'username');

    const [totalBets, totalWins, totalDeposits] = await Promise.all([
      Bet.countDocuments({ user: user._id }),
      Bet.aggregate([
        { $match: { user: user._id, status: 'WON' } },
        { $group: { _id: null, total: { $sum: '$potentialWin' } } },
      ]),
      Transaction.aggregate([
        { $match: { user: user._id, type: 'DEPOSIT', status: 'COMPLETED' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        ...user.toObject(),
        stats: {
          totalBets,
          totalWins: totalWins[0]?.total || 0,
          totalDeposits: totalDeposits[0]?.total || 0,
        },
      },
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
    });
  }
};