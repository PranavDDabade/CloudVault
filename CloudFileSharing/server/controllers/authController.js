const crypto = require('crypto');
const User = require('../models/User');
const { sendTokenResponse } = require('../utils/generateToken');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/sendEmail');
const { logActivity } = require('../utils/helpers');

// ── Register ──────────────────────────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const user = await User.create({ name, email, password });

    // Generate and send verification email
    const token = user.generateEmailVerifyToken();
    await user.save({ validateBeforeSave: false });

    try {
      await sendVerificationEmail(user, token);
    } catch (emailErr) {
      console.error('Failed to send verification email:', emailErr.message);
    }

    await logActivity({
      user: user._id,
      action: 'register',
      resourceType: 'auth',
      description: 'New account registered',
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    await sendTokenResponse(user, 201, res, 'Account created! Please check your email to verify your account.');
  } catch (error) {
    next(error);
  }
};

// ── Login ─────────────────────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Your account has been deactivated.' });
    }

    // Update last login
    user.lastLogin = new Date();
    user.loginCount += 1;
    await user.save({ validateBeforeSave: false });

    await logActivity({
      user: user._id,
      action: 'login',
      resourceType: 'auth',
      description: 'User logged in',
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    await sendTokenResponse(user, 200, res, 'Login successful.');
  } catch (error) {
    next(error);
  }
};

// ── Logout ────────────────────────────────────────────────────────────────────
exports.logout = async (req, res, next) => {
  try {
    await logActivity({
      user: req.user._id,
      action: 'logout',
      resourceType: 'auth',
      description: 'User logged out',
      ip: req.ip,
    });
    res.status(200).json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
};

// ── Verify Email ─────────────────────────────────────────────────────────────
exports.verifyEmail = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      emailVerifyToken: hashedToken,
      emailVerifyExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification link.' });
    }

    user.isVerified = true;
    user.emailVerifyToken = undefined;
    user.emailVerifyExpire = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, message: 'Email verified successfully! You can now log in.' });
  } catch (error) {
    next(error);
  }
};

// ── Resend Verification Email ─────────────────────────────────────────────────
exports.resendVerification = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Email is already verified.' });
    }
    const token = user.generateEmailVerifyToken();
    await user.save({ validateBeforeSave: false });
    await sendVerificationEmail(user, token);
    res.status(200).json({ success: true, message: 'Verification email sent.' });
  } catch (error) {
    next(error);
  }
};

// ── Forgot Password ───────────────────────────────────────────────────────────
exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    // Always respond with 200 to prevent email enumeration
    if (!user) {
      return res.status(200).json({ success: true, message: 'If an account exists, a reset link has been sent.' });
    }

    const token = user.generateResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    try {
      await sendPasswordResetEmail(user, token);
    } catch (emailErr) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return next(new Error('Failed to send email. Please try again.'));
    }

    res.status(200).json({ success: true, message: 'If an account exists, a reset link has been sent.' });
  } catch (error) {
    next(error);
  }
};

// ── Reset Password ────────────────────────────────────────────────────────────
exports.resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset link.' });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    await logActivity({
      user: user._id,
      action: 'password_change',
      resourceType: 'auth',
      description: 'Password reset via email link',
      ip: req.ip,
    });

    await sendTokenResponse(user, 200, res, 'Password reset successful.');
  } catch (error) {
    next(error);
  }
};

// ── Get Current User ──────────────────────────────────────────────────────────
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const userObj = user.toObject();
    if (userObj.avatarKey) {
      try {
        const { getSignedDownloadUrl } = require('../services/s3Service');
        userObj.avatar = await getSignedDownloadUrl(userObj.avatarKey, 86400);
      } catch (_) {}
    }
    res.status(200).json({ success: true, user: userObj });
  } catch (error) {
    next(error);
  }
};
