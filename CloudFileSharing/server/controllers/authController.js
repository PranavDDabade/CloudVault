const crypto = require('crypto');
const User = require('../models/User');
const { sendTokenResponse } = require('../utils/generateToken');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/sendEmail');
const { logActivity } = require('../utils/helpers');

// ── Register ──────────────────────────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    let { name, email, password } = req.body;

    console.log('[Register] Incoming Body:', req.body);
    console.log('[Register] Incoming email:', email);

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
    }

    // Normalize email
    email = email.toString().toLowerCase().trim();
    
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const user = await User.create({ name, email, password });
    console.log('[Register] User created');

    // 1. Generate token and save
    let token;
    try {
      token = user.generateEmailVerifyToken();
      console.log('[Register] Verification token generated');
      await user.save({ validateBeforeSave: false });
      console.log('[Register] User saved');
    } catch (saveErr) {
      console.error('[Register] Error generating token or saving user:', saveErr.message);
    }

    // 2. Send verification email (non-critical)
    try {
      if (token) {
        await sendVerificationEmail(user, token);
        console.log('[Register] Email sent');
      }
    } catch (emailErr) {
      console.error('[Register] Failed to send verification email:', emailErr.message);
    }

    // 3. Log activity (non-critical)
    try {
      await logActivity({
        user: user._id,
        action: 'register',
        resourceType: 'auth',
        description: 'New account registered',
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
      console.log('[Register] Activity logged');
    } catch (logErr) {
      console.error('[Register] Failed to log activity:', logErr.message);
    }

    // 4. Create Notification (non-critical)
    try {
      const Notification = require('../models/Notification');
      if (Notification) {
        await Notification.create({
          user: user._id,
          title: 'Welcome to CloudVault!',
          message: 'Thank you for registering. You have received 5GB of free storage.',
          type: 'system',
        });
        console.log('[Register] Notification created');
      }
    } catch (notifErr) {
      console.error('[Register] Failed to create notification:', notifErr.message);
    }

    // 5. Send Response
    try {
      console.log('[Register] JWT generated'); // sendTokenResponse generates JWT
      console.log('[Register] Cookies created'); // sendTokenResponse can create cookies if configured
      await sendTokenResponse(user, 201, res, 'Account created! Please check your email to verify your account.');
      console.log('[Register] Response sent');
    } catch (resErr) {
      console.error('[Register] Error sending token response:', resErr.message);
      // Fallback response if JWT generation fails
      if (!res.headersSent) {
        res.status(201).json({ 
          success: true, 
          message: 'Account created successfully, but there was an issue logging you in automatically. Please try logging in manually.',
          user: { _id: user._id, name: user.name, email: user.email }
        });
      }
    }
  } catch (error) {
    next(error);
  }
};

// ── Login ─────────────────────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    email = email.toString().toLowerCase().trim();

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
    let { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email.' });
    }
    
    email = email.toString().toLowerCase().trim();

    const user = await User.findOne({ email });

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
