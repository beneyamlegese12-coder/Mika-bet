// backend/src/services/emailService.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail({ to, subject, html, text }) {
    try {
      const mailOptions = {
        from: `"Mika-Bet" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''),
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`📧 Email sent: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error('Email error:', error);
      throw error;
    }
  }

  // Welcome email
  async sendWelcomeEmail(user) {
    const subject = 'Welcome to Mika-Bet! 🎉';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #ffffff; padding: 40px 20px; border-radius: 10px;">
        <div style="text-align: center;">
          <h1 style="color: #ffd700; font-size: 36px;">MIKA-BET</h1>
          <p style="color: #ffd700; font-size: 20px;">Welcome ${user.firstName || user.username}!</p>
        </div>
        <div style="background: #16213e; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #ffffff; font-size: 16px; line-height: 1.6;">
            Thank you for joining Mika-Bet! You've received a <strong style="color: #ffd700;">100 ETB</strong> welcome bonus to get started.
          </p>
          <ul style="color: #cccccc; font-size: 14px; line-height: 2;">
            <li>🎯 Place your first bet</li>
            <li>⚡ Live betting available</li>
            <li>🎰 Casino games included</li>
            <li>📱 Mobile friendly</li>
          </ul>
        </div>
        <div style="text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="display: inline-block; background: #ffd700; color: #1a1a2e; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: bold; font-size: 16px;">
            Start Betting Now
          </a>
        </div>
        <p style="color: #888888; font-size: 12px; text-align: center; margin-top: 20px;">
          Need help? Contact us at support@mikabet.com
        </p>
      </div>
    `;
    
    await this.sendEmail({ to: user.email, subject, html });
  }

  // Email verification
  async sendVerificationEmail(user, token) {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
    const subject = 'Verify Your Email - Mika-Bet';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #ffffff; padding: 40px 20px; border-radius: 10px;">
        <div style="text-align: center;">
          <h1 style="color: #ffd700; font-size: 32px;">MIKA-BET</h1>
          <h2 style="color: #ffffff;">Verify Your Email</h2>
        </div>
        <div style="background: #16213e; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #ffffff; font-size: 16px; line-height: 1.6;">
            Hi ${user.firstName || user.username}!
          </p>
          <p style="color: #cccccc; font-size: 14px; line-height: 1.6;">
            Please click the button below to verify your email address. This link expires in 24 hours.
          </p>
        </div>
        <div style="text-align: center;">
          <a href="${verificationUrl}" style="display: inline-block; background: #ffd700; color: #1a1a2e; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: bold; font-size: 16px;">
            Verify Email
          </a>
        </div>
        <p style="color: #888888; font-size: 12px; text-align: center; margin-top: 20px;">
          If you didn't create an account with Mika-Bet, please ignore this email.
        </p>
      </div>
    `;
    
    await this.sendEmail({ to: user.email, subject, html });
  }

  // Password reset
  async sendPasswordResetEmail(user, token) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    const subject = 'Reset Your Password - Mika-Bet';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #ffffff; padding: 40px 20px; border-radius: 10px;">
        <div style="text-align: center;">
          <h1 style="color: #ffd700; font-size: 32px;">MIKA-BET</h1>
          <h2 style="color: #ffffff;">Reset Your Password</h2>
        </div>
        <div style="background: #16213e; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #ffffff; font-size: 16px; line-height: 1.6;">
            Hi ${user.firstName || user.username}!
          </p>
          <p style="color: #cccccc; font-size: 14px; line-height: 1.6;">
            We received a request to reset your password. Click the button below to set a new password. This link expires in 1 hour.
          </p>
        </div>
        <div style="text-align: center;">
          <a href="${resetUrl}" style="display: inline-block; background: #ffd700; color: #1a1a2e; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: bold; font-size: 16px;">
            Reset Password
          </a>
        </div>
        <p style="color: #888888; font-size: 12px; text-align: center; margin-top: 20px;">
          If you didn't request a password reset, please ignore this email or contact support.
        </p>
      </div>
    `;
    
    await this.sendEmail({ to: user.email, subject, html });
  }

  // Transaction notification
  async sendTransactionNotification(user, transaction) {
    const subject = `Transaction ${transaction.status} - Mika-Bet`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #ffffff; padding: 40px 20px; border-radius: 10px;">
        <div style="text-align: center;">
          <h1 style="color: #ffd700; font-size: 32px;">MIKA-BET</h1>
          <h2 style="color: #ffffff;">Transaction Update</h2>
        </div>
        <div style="background: #16213e; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #ffffff; font-size: 16px; line-height: 1.6;">
            Your ${transaction.type} transaction of ${transaction.amount} ETB has been <strong style="color: #ffd700;">${transaction.status}</strong>.
          </p>
          <hr style="border-color: #333333;">
          <p style="color: #cccccc; font-size: 14px;">
            <strong>Transaction ID:</strong> ${transaction._id}<br>
            <strong>Amount:</strong> ${transaction.amount} ETB<br>
            <strong>Balance:</strong> ${transaction.balanceAfter} ETB
          </p>
        </div>
        <div style="text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/wallet" style="display: inline-block; background: #ffd700; color: #1a1a2e; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: bold; font-size: 16px;">
            View Wallet
          </a>
        </div>
      </div>
    `;
    
    await this.sendEmail({ to: user.email, subject, html });
  }
}

export default new EmailService();