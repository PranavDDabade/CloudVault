const bcrypt = require('bcryptjs');
const SharedFile = require('../models/SharedFile');
const File = require('../models/File');
const User = require('../models/User');
const { getSignedDownloadUrl } = require('../services/s3Service');
const { logActivity, createNotification } = require('../utils/helpers');
const { sendShareNotificationEmail } = require('../utils/sendEmail');

// ── Create Share Link / Share by Email ─────────────────────────────────────────
exports.createShare = async (req, res, next) => {
  try {
    const { fileId, isPublic, permissions, expiresAt, password, emails } = req.body;

    const file = await File.findOne({ _id: fileId, owner: req.user._id, isDeleted: false });
    if (!file) return res.status(404).json({ success: false, message: 'File not found.' });

    // Check if already shared
    let share = await SharedFile.findOne({ file: fileId, sharedBy: req.user._id });

    const sharedWith = [];
    const targetUsers = [];

    // Parse emails to resolve registered users
    if (emails && emails.length > 0) {
      for (const email of emails) {
        const lowerEmail = email.toLowerCase().trim();
        if (!lowerEmail) continue;

        // If updating existing share, check if already shared with this email
        if (share && share.sharedWith.some(sw => sw.email.toLowerCase() === lowerEmail)) {
          continue;
        }

        const user = await User.findOne({ email: lowerEmail });
        const sharedEntry = { email: lowerEmail };
        if (user) {
          sharedEntry.user = user._id;
          sharedEntry.acceptedAt = new Date();
          targetUsers.push(user);
        }
        sharedWith.push(sharedEntry);
      }
    }

    if (share) {
      // If we have an existing share and new emails are being added
      if (sharedWith.length > 0) {
        share.sharedWith.push(...sharedWith);
        
        // If password/expiry is updated, we can also update it
        if (password) {
          const salt = await bcrypt.genSalt(10);
          share.password = await bcrypt.hash(password, salt);
          share.hasPassword = true;
        }
        if (expiresAt !== undefined) share.expiresAt = expiresAt ? new Date(expiresAt) : null;
        
        await share.save();

        // Send email invitations for new emails
        const emailPromises = sharedWith.map((sw) =>
          sendShareNotificationEmail(sw.email, req.user.name, file.name, share.publicLink).catch(console.error)
        );
        await Promise.allSettled(emailPromises);

        // Send database notifications to registered users
        for (const targetUser of targetUsers) {
          await createNotification({
            user: targetUser._id,
            type: 'file_shared',
            title: 'File Shared with You',
            message: `"${req.user.name}" shared the file "${file.name}" with you.`,
            metadata: { fileId: file._id, shareId: share._id },
          });
        }

        return res.status(200).json({ success: true, message: 'Shared with new email addresses.', share });
      }

      // If no new emails to add, return conflict error or the existing share details
      return res.status(409).json({ success: false, message: 'File already has an active share.', share });
    }

    // Creating a brand new share
    const shareData = {
      file: fileId,
      sharedBy: req.user._id,
      isPublic: isPublic !== false,
      permissions: permissions || { canView: true, canDownload: true, canEdit: false },
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      sharedWith,
    };

    if (password) {
      const salt = await bcrypt.genSalt(10);
      shareData.password = await bcrypt.hash(password, salt);
      shareData.hasPassword = true;
    }

    share = await SharedFile.create(shareData);

    file.isShared = true;
    file.shareCount += 1;
    await file.save();

    // Send email invitations
    if (sharedWith.length > 0) {
      const emailPromises = sharedWith.map((sw) =>
        sendShareNotificationEmail(sw.email, req.user.name, file.name, share.publicLink).catch(console.error)
      );
      await Promise.allSettled(emailPromises);
    }

    // Send database notifications to registered users
    for (const targetUser of targetUsers) {
      await createNotification({
        user: targetUser._id,
        type: 'file_shared',
        title: 'File Shared with You',
        message: `"${req.user.name}" shared the file "${file.name}" with you.`,
        metadata: { fileId: file._id, shareId: share._id },
      });
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
