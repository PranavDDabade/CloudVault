const bcrypt = require('bcryptjs');
const SharedFile = require('../models/SharedFile');
const File = require('../models/File');
const User = require('../models/User');
const { getSignedDownloadUrl } = require('../services/s3Service');
const { logActivity, createNotification } = require('../utils/helpers');
const { sendShareNotificationEmail } = require('../utils/sendEmail');

// ── Create Share Link ─────────────────────────────────────────────────────────
exports.createShare = async (req, res, next) => {
  try {
    const { fileId, isPublic, permissions, expiresAt, password, emails } = req.body;

    const file = await File.findOne({ _id: fileId, owner: req.user._id, isDeleted: false });
    if (!file) return res.status(404).json({ success: false, message: 'File not found.' });

    // Check if already shared
    const existingShare = await SharedFile.findOne({ file: fileId, sharedBy: req.user._id });
    if (existingShare) {
      return res.status(409).json({ success: false, message: 'File already has a share link.', share: existingShare });
    }

    const shareData = {
      file: fileId,
      sharedBy: req.user._id,
      isPublic: isPublic !== false,
      permissions: permissions || { canView: true, canDownload: true, canEdit: false },
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    };

    if (password) {
      const salt = await bcrypt.genSalt(10);
      shareData.password = await bcrypt.hash(password, salt);
      shareData.hasPassword = true;
    }

    const share = await SharedFile.create(shareData);

    file.isShared = true;
    file.shareCount += 1;
    await file.save();

    // Send email invitations
    if (emails && emails.length > 0) {
      const emailPromises = emails.map((email) =>
        sendShareNotificationEmail(email, req.user.name, file.name, share.publicLink).catch(console.error)
      );
      await Promise.allSettled(emailPromises);
    }

    await logActivity({ user: req.user._id, action: 'share', resourceType: 'share', resourceId: share._id, resourceName: file.name, ip: req.ip });

    await createNotification({
      user: req.user._id,
      type: 'file_shared',
      title: 'File Shared',
      message: `"${file.name}" is now shared.`,
      metadata: { fileId: file._id, shareId: share._id },
    });

    res.status(201).json({ success: true, message: 'Share link created.', share });
  } catch (error) {
    next(error);
  }
};

// ── Get Share by Token (public access) ────────────────────────────────────────
exports.getShareByToken = async (req, res, next) => {
  try {
    const share = await SharedFile.findOne({ linkToken: req.params.token, isActive: true })
      .populate('file', 'name mimeType size fileType extension')
      .populate('sharedBy', 'name avatar');

    if (!share) return res.status(404).json({ success: false, message: 'Share link not found or has been disabled.' });

    if (share.isExpired) {
      return res.status(410).json({ success: false, message: 'This share link has expired.' });
    }

    // Password check
    if (share.hasPassword) {
      const { password } = req.body;
      if (!password) {
        return res.status(401).json({ success: false, message: 'This link is password protected.', requiresPassword: true });
      }
      const isMatch = await bcrypt.compare(password, share.password);
      if (!isMatch) return res.status(401).json({ success: false, message: 'Incorrect password.' });
    }

    share.accessCount += 1;
    share.lastAccessedAt = new Date();
    await share.save();

    res.status(200).json({ success: true, share });
  } catch (error) {
    next(error);
  }
};

// ── Download via Share Link ────────────────────────────────────────────────────
exports.downloadViaShare = async (req, res, next) => {
  try {
    const share = await SharedFile.findOne({ linkToken: req.params.token, isActive: true }).populate('file');

    if (!share || share.isExpired) {
      return res.status(404).json({ success: false, message: 'Share link not found or expired.' });
    }

    if (!share.permissions.canDownload) {
      return res.status(403).json({ success: false, message: 'Download not permitted for this link.' });
    }

    if (share.hasPassword) {
      const { password } = req.body;
      if (!password) return res.status(401).json({ success: false, message: 'Password required.', requiresPassword: true });
      const isMatch = await bcrypt.compare(password, share.password);
      if (!isMatch) return res.status(401).json({ success: false, message: 'Incorrect password.' });
    }

    const signedUrl = await getSignedDownloadUrl(share.file.key, 300, share.file.name);

    share.downloadCount += 1;
    await share.save();

    res.status(200).json({ success: true, downloadUrl: signedUrl });
  } catch (error) {
    next(error);
  }
};

// ── Get My Shares ──────────────────────────────────────────────────────────────
exports.getMyShares = async (req, res, next) => {
  try {
    const shares = await SharedFile.find({ sharedBy: req.user._id })
      .populate('file', 'name mimeType size fileType')
      .sort('-createdAt');
    res.status(200).json({ success: true, shares });
  } catch (error) {
    next(error);
  }
};

// ── Get Files Shared With Me ───────────────────────────────────────────────────
exports.getSharedWithMe = async (req, res, next) => {
  try {
    const shares = await SharedFile.find({
      'sharedWith.user': req.user._id,
      isActive: true,
    })
      .populate('file', 'name mimeType size fileType')
      .populate('sharedBy', 'name avatar')
      .sort('-createdAt');
    res.status(200).json({ success: true, shares });
  } catch (error) {
    next(error);
  }
};

// ── Update Share Settings ──────────────────────────────────────────────────────
exports.updateShare = async (req, res, next) => {
  try {
    const share = await SharedFile.findOne({ _id: req.params.id, sharedBy: req.user._id });
    if (!share) return res.status(404).json({ success: false, message: 'Share not found.' });

    const { permissions, expiresAt, isActive, password } = req.body;

    if (permissions) share.permissions = { ...share.permissions, ...permissions };
    if (expiresAt !== undefined) share.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (isActive !== undefined) share.isActive = isActive;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      share.password = await bcrypt.hash(password, salt);
      share.hasPassword = true;
    } else if (password === null) {
      share.password = undefined;
      share.hasPassword = false;
    }

    await share.save();

    res.status(200).json({ success: true, message: 'Share settings updated.', share });
  } catch (error) {
    next(error);
  }
};

// ── Delete Share ───────────────────────────────────────────────────────────────
exports.deleteShare = async (req, res, next) => {
  try {
    const share = await SharedFile.findOneAndDelete({ _id: req.params.id, sharedBy: req.user._id });
    if (!share) return res.status(404).json({ success: false, message: 'Share not found.' });

    // Update file
    await File.findByIdAndUpdate(share.file, { isShared: false, $inc: { shareCount: -1 } });

    await logActivity({ user: req.user._id, action: 'unshare', resourceType: 'share', description: 'Share link removed', ip: req.ip });

    res.status(200).json({ success: true, message: 'Share link removed.' });
  } catch (error) {
    next(error);
  }
};
