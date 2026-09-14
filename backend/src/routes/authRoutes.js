// backend/src/routes/authRoutes.js
import express from 'express';
import {
  register,
  login,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  changePassword,
  refreshToken,
  logout,
  getProfile,
} from '../controllers/authController.js';
import {
  registerValidation,
  loginValidation,
  emailValidation,
  resetPasswordValidation,
  changePasswordValidation,
} from '../validators/authValidators.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', emailValidation, resendVerification);
router.post('/forgot-password', emailValidation, forgotPassword);
router.post('/reset-password', resetPasswordValidation, resetPassword);
router.post('/refresh-token', refreshToken);

// Protected routes
router.post('/logout', authenticateToken, logout);
router.post('/change-password', authenticateToken, changePasswordValidation, changePassword);
router.get('/profile', authenticateToken, getProfile);

export default router;