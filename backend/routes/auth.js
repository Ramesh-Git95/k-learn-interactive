const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const SRSDeck = require('../models/SRSDeck');
const { authenticateToken, rateLimit } = require('../middleware/auth');
const emailService = require('../services/emailService');

const router = express.Router();

// Helper function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' } // Token expires in 7 days
  );
};

// Helper function to send auth response
const sendAuthResponse = (res, user, message = 'Success') => {
  const token = generateToken(user._id);
  
  res.json({
    message,
    token,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      subscription: user.subscription,
      progress: user.progress,
      preferences: user.preferences,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt
    }
  });
};

// Rate limiting for auth routes
const authRateLimit = rateLimit(15 * 60 * 1000, 10); // 10 requests per 15 minutes

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', authRateLimit, async (req, res) => {
  try {
    const { email, password, name, acceptedTerms } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        message: 'All fields are required',
        error: 'MISSING_FIELDS'
      });
    }

    if (!acceptedTerms) {
      return res.status(400).json({
        message: 'You must accept the Terms of Service and Privacy Policy',
        error: 'TERMS_NOT_ACCEPTED'
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters',
        error: 'PASSWORD_TOO_SHORT'
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists with this email',
        error: 'USER_EXISTS'
      });
    }
    
    // Create new user
    const user = new User({
      email,
      password,
      name: name.trim(),
      acceptedTermsAt: new Date(),
      progress: {
        lastActiveDate: new Date()
      }
    });

    // Generate email verification token
    const verificationToken = user.generateEmailVerificationToken();
    
    await user.save();

    // Auto-upgrade if they bought on Gumroad before creating this account
    try {
      const PendingUpgrade = mongoose.models.PendingUpgrade;
      if (PendingUpgrade) {
        const pending = await PendingUpgrade.findOne({ email: email.toLowerCase().trim() });
        if (pending) {
          user.subscription.type = 'premium';
          user.subscription.status = 'active';
          user.subscription.currentPeriodEnd = null;
          user.subscription.cancelAtPeriodEnd = false;
          user.subscription.stripeSubscriptionId = pending.saleId || pending.licenseKey || 'gumroad-lifetime';
          await user.save();
          await PendingUpgrade.deleteOne({ _id: pending._id });
          console.log(`✅ Auto-upgraded new registration ${email} from PendingUpgrade`);
        }
      }
    } catch (upgradeErr) {
      console.error('PendingUpgrade check failed on register:', upgradeErr);
    }

    const token = generateToken(user._id);

    // Respond immediately so the frontend isn't blocked by email sending
    res.status(201).json({
      message: 'Registration successful! Please check your email to verify your account.',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        subscription: user.subscription,
        progress: user.progress,
        preferences: user.preferences,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt
      },
      emailSent: true,
    });

    // Send verification email in background — never blocks the response
    emailService.sendVerificationEmail(user.email, user.name, verificationToken)
      .then(() => console.log(`📧 Verification email sent to ${email}`))
      .catch(err => console.error('Verification email failed:', err.message));

    console.log(`✅ New user registered: ${email}`);
    
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: 'Validation error',
        error: 'VALIDATION_ERROR',
        errors
      });
    }
    
    res.status(500).json({
      message: 'Registration failed',
      error: 'REGISTRATION_ERROR'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authRateLimit, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required',
        error: 'MISSING_CREDENTIALS'
      });
    }
    
    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password',
        error: 'INVALID_CREDENTIALS'
      });
    }
    
    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        message: 'Account is deactivated',
        error: 'ACCOUNT_DEACTIVATED'
      });
    }
    
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid email or password',
        error: 'INVALID_CREDENTIALS'
      });
    }
    
    // Update last active date
    await user.updateLastActive();
    
    // Log the login
    console.log(`🔐 User logged in: ${email}`);
    
    sendAuthResponse(res, user, 'Login successful! Welcome back! 👋');
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Login failed',
      error: 'LOGIN_ERROR'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // Update last active date
    await req.user.updateLastActive();
    
    res.json({
      message: 'User profile retrieved successfully',
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        subscription: req.user.subscription,
        progress: req.user.progress,
        preferences: req.user.preferences,
        emailVerified: req.user.emailVerified,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt
      }
    });
    
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      message: 'Failed to get user profile',
      error: 'PROFILE_ERROR'
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, preferences } = req.body;
    const user = req.user;
    
    // Update allowed fields
    if (name && name.trim()) {
      user.name = name.trim();
    }
    
    if (preferences) {
      // Update preferences (merge with existing)
      if (preferences.language) user.preferences.language = preferences.language;
      if (preferences.theme) user.preferences.theme = preferences.theme;
      if (preferences.notifications) {
        user.preferences.notifications = {
          ...user.preferences.notifications,
          ...preferences.notifications
        };
      }
    }
    
    await user.save();
    
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        subscription: user.subscription,
        progress: user.progress,
        preferences: user.preferences,
        emailVerified: user.emailVerified
      }
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: 'Validation error',
        error: 'VALIDATION_ERROR',
        errors
      });
    }
    
    res.status(500).json({
      message: 'Failed to update profile',
      error: 'UPDATE_PROFILE_ERROR'
    });
  }
});

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', authenticateToken, authRateLimit, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;
    
    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: 'Current password and new password are required',
        error: 'MISSING_PASSWORDS'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        message: 'New password must be at least 6 characters',
        error: 'PASSWORD_TOO_SHORT'
      });
    }
    
    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        message: 'Current password is incorrect',
        error: 'INVALID_CURRENT_PASSWORD'
      });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    console.log(`🔒 Password changed for user: ${user.email}`);
    
    res.json({
      message: 'Password changed successfully'
    });
    
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      message: 'Failed to change password',
      error: 'CHANGE_PASSWORD_ERROR'
    });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh JWT token
// @access  Private
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    // Generate new token
    const token = generateToken(req.user._id);
    
    res.json({
      message: 'Token refreshed successfully',
      token
    });
    
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      message: 'Failed to refresh token',
      error: 'REFRESH_TOKEN_ERROR'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client should delete token)
// @access  Private
router.post('/logout', authenticateToken, (req, res) => {
  console.log(`👋 User logged out: ${req.user.email}`);

  res.json({
    message: 'Logout successful'
  });
});

// @route   DELETE /api/auth/account
// @desc    Permanently delete authenticated user's account
// @access  Private
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    // Cancel any active Stripe subscription first — otherwise a deleted account
    // keeps getting billed every month. Only attempt it for a real Stripe
    // subscription id (sub_...), not a Gumroad lifetime placeholder, and never
    // let a Stripe hiccup block the account deletion.
    const subId = user.subscription && user.subscription.stripeSubscriptionId;
    if (subId && subId.startsWith('sub_') && process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, { maxNetworkRetries: 3 });
        await stripe.subscriptions.cancel(subId);
        console.log(`🧾 Cancelled Stripe subscription ${subId} for ${user.email}`);
      } catch (e) {
        console.error('⚠️  Failed to cancel Stripe subscription on account delete:', e.message);
      }
    }

    // Cascade-delete the user's owned data that lives in its own collection.
    // (Bookmarks and progress are embedded in the user doc, so they go with it.)
    await SRSDeck.deleteMany({ userId: user._id });

    await User.findByIdAndDelete(user._id);
    console.log(`🗑️ Account deleted: ${user.email}`);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ message: 'Failed to delete account', error: 'DELETE_ACCOUNT_ERROR' });
  }
});

// @route   GET /api/auth/verify-email/:token
// @desc    Verify user email with token
// @access  Public
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({
        message: 'Verification token is required',
        error: 'MISSING_TOKEN'
      });
    }
    
    // Find user with valid verification token
    const crypto = require('crypto');
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    }).select('+emailVerificationToken +emailVerificationExpires');
    
    if (!user) {
      return res.status(400).json({
        message: 'Invalid or expired verification token',
        error: 'INVALID_TOKEN'
      });
    }
    
    // Check if already verified
    if (user.emailVerified) {
      return res.json({
        message: 'Email is already verified',
        verified: true
      });
    }
    
    // Mark email as verified
    await user.markEmailAsVerified();
    
    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(user.email, user.name);
      console.log(`📧 Welcome email sent to: ${user.email}`);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }
    
    console.log(`✅ Email verified for user: ${user.email}`);
    
    res.json({
      message: 'Email verified successfully! Welcome to K-Learn Korean! 🎉',
      verified: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        emailVerified: true
      }
    });
    
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      message: 'Email verification failed',
      error: 'VERIFICATION_ERROR'
    });
  }
});

// @route   POST /api/auth/resend-verification
// @desc    Resend verification email
// @access  Public
router.post('/resend-verification', authRateLimit, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        message: 'Email is required',
        error: 'MISSING_EMAIL'
      });
    }
    
    const user = await User.findByEmail(email);
    
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({
        message: 'If an account with this email exists and is not verified, a verification email has been sent.'
      });
    }
    
    if (user.emailVerified) {
      return res.json({
        message: 'Email is already verified'
      });
    }
    
    // Generate new verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();
    
    // Send verification email
    try {
      const emailResult = await emailService.sendVerificationEmail(
        user.email,
        user.name,
        verificationToken
      );
      
      console.log(`📧 Verification email resent to: ${user.email}`);
      
      res.json({
        message: 'Verification email sent successfully! Please check your email.',
        emailSent: true,
        emailPreview: emailResult.previewUrl // Only in development
      });
      
    } catch (emailError) {
      console.error('Failed to resend verification email:', emailError);
      res.status(500).json({
        message: 'Failed to send verification email. Please try again.',
        error: 'EMAIL_SEND_ERROR'
      });
    }
    
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      message: 'Failed to resend verification email',
      error: 'RESEND_ERROR'
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', authRateLimit, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required', error: 'MISSING_EMAIL' });
    }

    const user = await User.findByEmail(email);

    // Always return the same response — don't reveal if email exists
    if (!user) {
      return res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    try {
      await emailService.sendPasswordResetEmail(user.email, user.name, resetToken);
      res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError);
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      res.status(500).json({ message: 'Failed to send reset email. Please try again.', error: 'EMAIL_SEND_ERROR' });
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Something went wrong', error: 'SERVER_ERROR' });
  }
});

// @route   POST /api/auth/reset-password/:token
// @desc    Reset password using token from email
// @access  Public
router.post('/reset-password/:token', authRateLimit, async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters', error: 'PASSWORD_TOO_SHORT' });
    }

    const crypto = require('crypto');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      return res.status(400).json({ message: 'Reset link is invalid or has expired', error: 'INVALID_TOKEN' });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful! You can now sign in with your new password.' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Something went wrong', error: 'SERVER_ERROR' });
  }
});

module.exports = router;
