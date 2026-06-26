const User = require('../models/User');
const File = require('../models/File');
const Folder = require('../models/Folder');
const { uploadToS3, deleteFromS3, getSignedDownloadUrl } = require('../services/s3Service');
const { generateS3Key, logActivity } = require('../utils/helpers');

// ── Get Profile ───────────────────────────────────────────────────────────────
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const fileCount = await File.countDocuments({ owner: req.user._id, isDeleted: false });
    const userObj = user.toObject();
    if (userObj.avatarKey) {
      try {
        userObj.avatar = await getSignedDownloadUrl(userObj.avatarKey, 86400);
      } catch (_) {}
    }

    res.status(200).json({
      success: true,
      user: {
        ...userObj,
        fileCount,
        storageUsagePercent: user.storageUsagePercent,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── Update Profile ────────────────────────────────────────────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, preferences } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (preferences) updateData.preferences = { ...req.user.preferences, ...preferences };

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    });

    const userObj = user.toObject();
    if (userObj.avatarKey) {
      try {
        userObj.avatar = await getSignedDownloadUrl(userObj.avatarKey, 86400);
      } catch (_) {}
    }

    await logActivity({
      user: req.user._id,
      action: 'profile_update',
      resourceType: 'user',
      description: 'Profile updated',
      ip: req.ip,
    });

    res.status(200).json({ success: true, message: 'Profile updated successfully.', user: userObj });
  } catch (error) {
    next(error);
  }
};

// ── Upload Avatar ─────────────────────────────────────────────────────────────
exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No avatar file provided.' });
    }

    const user = await User.findById(req.user._id);

    // Delete old avatar from S3
    if (user.avatarKey) {
      try {
        await deleteFromS3(user.avatarKey);
      } catch (_) {}
    }

    const key = generateS3Key(req.user._id, `avatar.${req.file.originalname.split('.').pop()}`);
    const { url } = await uploadToS3({
      buffer: req.file.buffer,
      key,
      mimetype: req.file.mimetype,
      metadata: { userId: req.user._id.toString(), type: 'avatar' },
    });

    user.avatar = url;
    user.avatarKey = key;
    await user.save({ validateBeforeSave: false });

    // Generate signed URL for immediate use in client, fallback to raw url on failure
    let signedAvatarUrl = url;
    try {
      signedAvatarUrl = await getSignedDownloadUrl(key, 86400);
    } catch (err) {
      console.error('Failed to pre-sign S3 URL for avatar:', err.message);
    }

    await logActivity({
      user: req.user._id,
      action: 'avatar_update',
      resourceType: 'user',
      description: 'Avatar updated',
      ip: req.ip,
    });

    res.status(200).json({ success: true, message: 'Avatar updated.', avatar: signedAvatarUrl });
  } catch (error) {
    next(error);
  }
};

// ── Change Password ───────────────────────────────────────────────────────────
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ success: false, message: 'New password must be different.' });
    }

    user.password = newPassword;
    await user.save();

    await logActivity({
      user: req.user._id,
      action: 'password_change',
      resourceType: 'user',
      description: 'Password changed',
      ip: req.ip,
    });

    res.status(200).json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    next(error);
  }
};

// ── Delete Account ────────────────────────────────────────────────────────────
exports.deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Incorrect password.' });
    }

    // Soft-deactivate
    user.isActive = false;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, message: 'Account deactivated. Contact support to recover it.' });
  } catch (error) {
    next(error);
  }
};

// ── Get Storage Stats ─────────────────────────────────────────────────────────
exports.getStorageStats = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    const fileTypeStats = await File.aggregate([
      { $match: { owner: req.user._id, isDeleted: false } },
      { $group: { _id: '$fileType', count: { $sum: 1 }, totalSize: { $sum: '$size' } } },
      { $sort: { totalSize: -1 } },
    ]);

    const totalFiles = await File.countDocuments({ owner: req.user._id, isDeleted: false });
    const trashFiles = await File.countDocuments({ owner: req.user._id, isDeleted: true });
    const totalFolders = await Folder.countDocuments({ owner: req.user._id, isDeleted: false });
    const trashFolders = await Folder.countDocuments({ owner: req.user._id, isDeleted: true });

    res.status(200).json({
      success: true,
      stats: {
        storageUsed: user.storageUsed,
        storageLimit: user.storageLimit,
        storageUsagePercent: user.storageUsagePercent,
        plan: user.plan,
        totalFiles,
        trashFiles,
        totalFolders,
        trashFolders,
        fileTypeStats,
      },
    });
  } catch (error) {
    next(error);
  }
};
