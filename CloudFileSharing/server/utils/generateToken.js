const jwt = require('jsonwebtoken');

/**
 * Generate JWT access token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

/**
 * Generate JWT refresh token
 */
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
  });
};

/**
 * Send token response with cookie
 */
const sendTokenResponse = async (user, statusCode, res, message = 'Success') => {
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Remove sensitive fields
  const userObj = user.toObject ? user.toObject() : user;
  delete userObj.password;
  delete userObj.resetPasswordToken;
  delete userObj.resetPasswordExpire;
  delete userObj.emailVerifyToken;
  delete userObj.emailVerifyExpire;

  if (userObj.avatarKey) {
    try {
      const { getSignedDownloadUrl } = require('../services/s3Service');
      userObj.avatar = await getSignedDownloadUrl(userObj.avatarKey, 86400); // 24 hours expiry
    } catch (_) {}
  }

  res.status(statusCode).json({
    success: true,
    message,
    token,
    refreshToken,
    user: userObj,
  });
};

module.exports = { generateToken, generateRefreshToken, sendTokenResponse };
