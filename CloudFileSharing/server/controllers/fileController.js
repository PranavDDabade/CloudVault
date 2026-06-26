const File = require('../models/File');
const Folder = require('../models/Folder');
const User = require('../models/User');
const { uploadToS3, getSignedDownloadUrl, deleteFromS3, copyInS3 } = require('../services/s3Service');
const { generateS3Key, paginate, getPaginationMeta, logActivity, createNotification, sanitizeFilename } = require('../utils/helpers');
const { v4: uuidv4 } = require('uuid');

// ── Upload Files ───────────────────────────────────────────────────────────────
exports.uploadFiles = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files provided.' });
    }

    const user = await User.findById(req.user._id);
    const { folderId } = req.body;

    // Check storage limit
    const totalUploadSize = req.files.reduce((sum, f) => sum + f.size, 0);
    if (user.storageUsed + totalUploadSize > user.storageLimit) {
      return res.status(413).json({ success: false, message: 'Storage limit exceeded.' });
    }

    // Validate folder ownership
    if (folderId) {
      const folder = await Folder.findOne({ _id: folderId, owner: req.user._id });
      if (!folder) return res.status(404).json({ success: false, message: 'Folder not found.' });
    }

    const uploadedFiles = [];

    for (const file of req.files) {
      const cleanName = sanitizeFilename(file.originalname);
      const key = generateS3Key(req.user._id.toString(), file.originalname);

      // Upload to S3
      const { url } = await uploadToS3({
        buffer: file.buffer,
        key,
        mimetype: file.mimetype,
        metadata: { userId: req.user._id.toString(), originalName: cleanName },
      });

      const newFile = await File.create({
        name: cleanName,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url,
        key,
        owner: req.user._id,
        folder: folderId || null,
      });

      uploadedFiles.push(newFile);
    }

    // Update user storage
    user.storageUsed += totalUploadSize;
    await user.save({ validateBeforeSave: false });

    await logActivity({
      user: req.user._id,
      action: 'upload',
      resourceType: 'file',
      description: `Uploaded ${uploadedFiles.length} file(s)`,
      metadata: { count: uploadedFiles.length, totalSize: totalUploadSize },
      ip: req.ip,
    });

    await createNotification({
      user: req.user._id,
      type: 'upload_success',
      title: 'Upload Complete',
      message: `${uploadedFiles.length} file(s) uploaded successfully.`,
      metadata: { fileId: uploadedFiles[0]?._id },
    });

    const filesWithUrls = await Promise.all(
      uploadedFiles.map(async (file) => {
        const fileObj = file.toObject();
        fileObj.previewUrl = await getSignedDownloadUrl(file.key, 3600);
        return fileObj;
      })
    );

    res.status(201).json({ success: true, message: 'Files uploaded successfully.', files: filesWithUrls });
  } catch (error) {
    next(error);
  }
};

// ── Get Files ──────────────────────────────────────────────────────────────────
exports.getFiles = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 20, folderId, fileType, search, sort = '-createdAt',
      favorites, tags,
    } = req.query;

    const query = { owner: req.user._id, isDeleted: false };

    if (folderId === 'root' || !folderId) {
      query.folder = null;
    } else if (folderId) {
      query.folder = folderId;
    }

    if (fileType) query.fileType = fileType;
    if (favorites === 'true') query.isFavorite = true;
    if (tags) query.tags = { $in: tags.split(',') };

    if (search) {
      query.$text = { $search: search };
    }

    const { skip, limit: limitNum } = paginate(query, page, limit);
    const total = await File.countDocuments(query);
    const files = await File.find(query)
      .populate('folder', 'name')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const filesWithUrls = await Promise.all(
      files.map(async (file) => {
        file.previewUrl = await getSignedDownloadUrl(file.key, 3600);
        return file;
      })
    );

    res.status(200).json({
      success: true,
      files: filesWithUrls,
      pagination: getPaginationMeta(total, parseInt(page), limitNum),
    });
  } catch (error) {
    next(error);
  }
};

// ── Get Single File ────────────────────────────────────────────────────────────
exports.getFile = async (req, res, next) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id })
      .populate('folder', 'name path');
    if (!file) return res.status(404).json({ success: false, message: 'File not found.' });
console.log(`[View Tracking] Incrementing view count for file: ${file._id}`);
    file.viewCount += 1;
    await file.save();

    const fileObj = file.toObject();
    fileObj.previewUrl = await getSignedDownloadUrl(file.key, 3600);

    res.status(200).json({ success: true, file: fileObj });
  } catch (error) {
    next(error);
  }
};

// ── Download File ──────────────────────────────────────────────────────────────
exports.downloadFile = async (req, res, next) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id });
    if (!file) return res.status(404).json({ success: false, message: 'File not found.' });

    const signedUrl = await getSignedDownloadUrl(file.key, 300, file.name); // 5 min expiry

    file.downloadCount += 1;
    await file.save();

    await logActivity({
      user: req.user._id,
      action: 'download',
      resourceType: 'file',
      resourceId: file._id,
      resourceName: file.name,
      ip: req.ip,
    });

    res.status(200).json({ success: true, downloadUrl: signedUrl });
  } catch (error) {
    next(error);
  }
};

// ── Update File (rename, move, tags, color) ────────────────────────────────────
exports.updateFile = async (req, res, next) => {
  try {
    const { name, folderId, tags, color, description } = req.body;
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id });
    if (!file) return res.status(404).json({ success: false, message: 'File not found.' });

    const oldName = file.name;
    if (name) file.name = sanitizeFilename(name);
    if (folderId !== undefined) file.folder = folderId || null;
    if (tags) file.tags = tags;
    if (color !== undefined) file.color = color;
    if (description !== undefined) file.description = description;

    await file.save();

    await logActivity({
      user: req.user._id,
      action: name && name !== oldName ? 'rename' : 'move',
      resourceType: 'file',
      resourceId: file._id,
      resourceName: file.name,
      description: `File updated`,
      ip: req.ip,
    });

    const fileObj = file.toObject();
    fileObj.previewUrl = await getSignedDownloadUrl(file.key, 3600);

    res.status(200).json({ success: true, message: 'File updated.', file: fileObj });
  } catch (error) {
    next(error);
  }
};

// ── Soft Delete ────────────────────────────────────────────────────────────────
exports.deleteFile = async (req, res, next) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id, isDeleted: false });
    if (!file) return res.status(404).json({ success: false, message: 'File not found.' });

    file.isDeleted = true;
    file.deletedAt = new Date();
    await file.save();

    await logActivity({
      user: req.user._id,
      action: 'delete',
      resourceType: 'file',
      resourceId: file._id,
      resourceName: file.name,
      ip: req.ip,
    });

    res.status(200).json({ success: true, message: 'File moved to trash.' });
  } catch (error) {
    next(error);
  }
};

// ── Restore from Trash ─────────────────────────────────────────────────────────
exports.restoreFile = async (req, res, next) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id, isDeleted: true });
    if (!file) return res.status(404).json({ success: false, message: 'File not found in trash.' });

    file.isDeleted = false;
    file.deletedAt = null;
    await file.save();

    await logActivity({ user: req.user._id, action: 'restore', resourceType: 'file', resourceId: file._id, resourceName: file.name, ip: req.ip });

    const fileObj = file.toObject();
    fileObj.previewUrl = await getSignedDownloadUrl(file.key, 3600);

    res.status(200).json({ success: true, message: 'File restored.', file: fileObj });
  } catch (error) {
    next(error);
  }
};

// ── Permanent Delete ───────────────────────────────────────────────────────────
exports.permanentDelete = async (req, res, next) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id, isDeleted: true });
    if (!file) return res.status(404).json({ success: false, message: 'File not found in trash.' });

    // Delete from S3
    try { await deleteFromS3(file.key); } catch (_) {}

    // Update user storage
    await User.findByIdAndUpdate(req.user._id, { $inc: { storageUsed: -file.size } });

    await File.deleteOne({ _id: file._id });

    await logActivity({ user: req.user._id, action: 'permanent_delete', resourceType: 'file', resourceName: file.name, ip: req.ip });

    res.status(200).json({ success: true, message: 'File permanently deleted.' });
  } catch (error) {
    next(error);
  }
};

// ── Get Trash ──────────────────────────────────────────────────────────────────
exports.getTrash = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const skip = (pageNum - 1) * limitNum;

    const query = { owner: req.user._id, isDeleted: true };

    const files = await File.find(query).sort('-deletedAt').lean();
    const folders = await Folder.find(query).sort('-deletedAt').lean();

    const foldersMapped = folders.map(f => ({ ...f, isFolder: true }));
    const filesWithUrls = await Promise.all(
      files.map(async (file) => {
        file.previewUrl = await getSignedDownloadUrl(file.key, 3600);
        return file;
      })
    );

    const combined = [...foldersMapped, ...filesWithUrls].sort(
      (a, b) => new Date(b.deletedAt) - new Date(a.deletedAt)
    );

    const total = combined.length;
    const paginatedItems = combined.slice(skip, skip + limitNum);

    res.status(200).json({
      success: true,
      files: paginatedItems,
      pagination: getPaginationMeta(total, pageNum, limitNum),
    });
  } catch (error) {
    next(error);
  }
};

// ── Toggle Favorite ────────────────────────────────────────────────────────────
exports.toggleFavorite = async (req, res, next) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id });
    if (!file) return res.status(404).json({ success: false, message: 'File not found.' });

    file.isFavorite = !file.isFavorite;
    await file.save();

    await logActivity({ user: req.user._id, action: file.isFavorite ? 'favorite' : 'unfavorite', resourceType: 'file', resourceId: file._id, resourceName: file.name, ip: req.ip });

    res.status(200).json({ success: true, message: file.isFavorite ? 'Added to favorites.' : 'Removed from favorites.', isFavorite: file.isFavorite });
  } catch (error) {
    next(error);
  }
};

// ── Duplicate File ─────────────────────────────────────────────────────────────
exports.duplicateFile = async (req, res, next) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id });
    if (!file) return res.status(404).json({ success: false, message: 'File not found.' });

    const user = await User.findById(req.user._id);
    if (user.storageUsed + file.size > user.storageLimit) {
      return res.status(413).json({ success: false, message: 'Storage limit exceeded.' });
    }

    const newKey = generateS3Key(req.user._id.toString(), file.originalName);
    const { url } = await copyInS3(file.key, newKey);

    const duplicatedFile = await File.create({
      name: `Copy of ${file.name}`,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      url,
      key: newKey,
      owner: req.user._id,
      folder: file.folder,
    });

    user.storageUsed += file.size;
    await user.save({ validateBeforeSave: false });

    await logActivity({ user: req.user._id, action: 'copy', resourceType: 'file', resourceId: file._id, resourceName: file.name, ip: req.ip });

    const fileObj = duplicatedFile.toObject();
    fileObj.previewUrl = await getSignedDownloadUrl(duplicatedFile.key, 3600);

    res.status(201).json({ success: true, message: 'File duplicated.', file: fileObj });
  } catch (error) {
    next(error);
  }
};

// ── Get Recent Files ───────────────────────────────────────────────────────────
exports.getRecentFiles = async (req, res, next) => {
  try {
    const files = await File.find({ owner: req.user._id, isDeleted: false })
      .sort('-createdAt')
      .limit(10)
      .lean();
    const filesWithUrls = await Promise.all(
      files.map(async (file) => {
        file.previewUrl = await getSignedDownloadUrl(file.key, 3600);
        return file;
      })
    );

    res.status(200).json({ success: true, files: filesWithUrls });
  } catch (error) {
    next(error);
  }
};

// ── Empty Trash ────────────────────────────────────────────────────────────────
exports.emptyTrash = async (req, res, next) => {
  try {
    const files = await File.find({ owner: req.user._id, isDeleted: true });
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);

    // Delete all from S3
    await Promise.allSettled(files.map((f) => deleteFromS3(f.key)));

    await File.deleteMany({ owner: req.user._id, isDeleted: true });
    await User.findByIdAndUpdate(req.user._id, { $inc: { storageUsed: -totalSize } });

    res.status(200).json({ success: true, message: `Trash emptied. ${files.length} file(s) permanently deleted.` });
  } catch (error) {
    next(error);
  }
};

// ── Analytics Stats ────────────────────────────────────────────────────────────
exports.getStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const ActivityLog = require('../models/ActivityLog');
    const Folder = require('../models/Folder');

    // Thirty days ago for trend chart
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      fileTypeAgg,
      uploadTrendAgg,
      topDownloaded,
      topViewed,
      quickCounts,
      folderCount,
      recentActivity,
    ] = await Promise.all([

      // 1. File type distribution (active files only)
      File.aggregate([
        { $match: { owner: userId, isDeleted: false } },
        {
          $group: {
            _id: '$fileType',
            count: { $sum: 1 },
            totalSize: { $sum: '$size' },
          },
        },
        { $sort: { totalSize: -1 } },
      ]),

      // 2. Upload trend — daily counts for last 30 days
      File.aggregate([
        {
          $match: {
            owner: userId,
            isDeleted: false,
            createdAt: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
            totalSize: { $sum: '$size' },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // 3. Top 5 files by download count
      File.find({ owner: userId, isDeleted: false, downloadCount: { $gt: 0 } })
        .sort({ downloadCount: -1 })
        .limit(5)
        .select('name fileType size downloadCount viewCount mimeType key')
        .lean(),

      // 4. Top 5 files by view count
      File.find({ owner: userId, isDeleted: false, viewCount: { $gt: 0 } })
        .sort({ viewCount: -1 })
        .limit(5)
        .select('name fileType size downloadCount viewCount mimeType key')
        .lean(),

      // 5. Quick scalar counts
      File.aggregate([
        { $match: { owner: userId } },
        {
          $group: {
            _id: null,
            totalFiles: {
              $sum: { $cond: [{ $eq: ['$isDeleted', false] }, 1, 0] },
            },
            trashCount: {
              $sum: { $cond: [{ $eq: ['$isDeleted', true] }, 1, 0] },
            },
            favoritesCount: {
              $sum: {
                $cond: [
                  { $and: [{ $eq: ['$isDeleted', false] }, { $eq: ['$isFavorite', true] }] },
                  1,
                  0,
                ],
              },
            },
            sharedCount: {
              $sum: {
                $cond: [
                  { $and: [{ $eq: ['$isDeleted', false] }, { $eq: ['$isShared', true] }] },
                  1,
                  0,
                ],
              },
            },
            totalDownloads: { $sum: '$downloadCount' },
            totalViews: { $sum: '$viewCount' },
          },
        },
      ]),

      // 6. Folder count
      Folder.countDocuments({ owner: userId, isDeleted: false }),

      // 7. Recent activity (last 10 entries)
      ActivityLog.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('action resourceType resourceName description createdAt metadata')
        .lean(),
    ]);

    const counts = quickCounts[0] || {
      totalFiles: 0,
      trashCount: 0,
      favoritesCount: 0,
      sharedCount: 0,
      totalDownloads: 0,
      totalViews: 0,
    };

    res.status(200).json({
      success: true,
      stats: {
        fileTypes: fileTypeAgg,
        uploadTrend: uploadTrendAgg,
        topDownloaded,
        topViewed,
        totalFiles: counts.totalFiles,
        trashCount: counts.trashCount,
        favoritesCount: counts.favoritesCount,
        sharedCount: counts.sharedCount,
        totalDownloads: counts.totalDownloads,
        totalViews: counts.totalViews,
        folderCount,
        recentActivity,
      },
    });
  } catch (error) {
    next(error);
  }
};
