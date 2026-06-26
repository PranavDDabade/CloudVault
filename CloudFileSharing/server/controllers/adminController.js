const User = require('../models/User');
const File = require('../models/File');
const Folder = require('../models/Folder');
const SharedFile = require('../models/SharedFile');
const ActivityLog = require('../models/ActivityLog');
const { getPaginationMeta, paginate } = require('../utils/helpers');

// ── Dashboard Stats ────────────────────────────────────────────────────────────
exports.getStats = async (req, res, next) => {
  try {
    const [totalUsers, activeUsers, totalFiles, totalFolders, totalShares] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      File.countDocuments({ isDeleted: false }),
      Folder.countDocuments({ isDeleted: false }),
      SharedFile.countDocuments({ isActive: true }),
    ]);

    // Storage stats
    const storageAgg = await User.aggregate([
      { $group: { _id: null, totalUsed: { $sum: '$storageUsed' }, totalLimit: { $sum: '$storageLimit' } } },
    ]);

    // New users this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const newUsersThisMonth = await User.countDocuments({ createdAt: { $gte: startOfMonth } });

    // Files uploaded this week
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    const filesThisWeek = await File.countDocuments({ createdAt: { $gte: startOfWeek }, isDeleted: false });

    // Plan distribution
    const planStats = await User.aggregate([
      { $group: { _id: '$plan', count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        totalFiles,
        totalFolders,
        totalShares,
        newUsersThisMonth,
        filesThisWeek,
        storage: storageAgg[0] || { totalUsed: 0, totalLimit: 0 },
        planStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── Get All Users ──────────────────────────────────────────────────────────────
exports.getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, role, isActive } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const { skip, limit: limitNum } = paginate(query, page, limit);
    const total = await User.countDocuments(query);
    const users = await User.find(query).select('-password -resetPasswordToken -emailVerifyToken').sort('-createdAt').skip(skip).limit(limitNum);

    res.status(200).json({ success: true, users, pagination: getPaginationMeta(total, parseInt(page), limitNum) });
  } catch (error) {
    next(error);
  }
};

// ── Get Single User ────────────────────────────────────────────────────────────
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const fileCount = await File.countDocuments({ owner: user._id, isDeleted: false });
    const sharedCount = await SharedFile.countDocuments({ sharedBy: user._id });
    const recentActivity = await ActivityLog.find({ user: user._id }).sort('-createdAt').limit(10);

    res.status(200).json({ success: true, user, stats: { fileCount, sharedCount }, recentActivity });
  } catch (error) {
    next(error);
  }
};

// ── Update User ────────────────────────────────────────────────────────────────
exports.updateUser = async (req, res, next) => {
  try {
    const { role, isActive, storageLimit, plan } = req.body;
    const updateData = {};

    if (role) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (storageLimit) updateData.storageLimit = storageLimit;
    if (plan) updateData.plan = plan;

    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    res.status(200).json({ success: true, message: 'User updated.', user });
  } catch (error) {
    next(error);
  }
};

// ── Delete User ────────────────────────────────────────────────────────────────
exports.deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own admin account.' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    res.status(200).json({ success: true, message: 'User deactivated.' });
  } catch (error) {
    next(error);
  }
};

// ── Get Recent Activity ────────────────────────────────────────────────────────
exports.getRecentActivity = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const { skip, limit: limitNum } = paginate({}, page, limit);
    const total = await ActivityLog.countDocuments();
    const logs = await ActivityLog.find()
      .populate('user', 'name email avatar')
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({ success: true, logs, pagination: getPaginationMeta(total, parseInt(page), limitNum) });
  } catch (error) {
    next(error);
  }
};

// ── Storage Analytics ──────────────────────────────────────────────────────────
exports.getStorageAnalytics = async (req, res, next) => {
  try {
    const byFileType = await File.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$fileType', count: { $sum: 1 }, totalSize: { $sum: '$size' } } },
      { $sort: { totalSize: -1 } },
    ]);

    const topUsers = await User.find().sort('-storageUsed').limit(10).select('name email storageUsed storageLimit plan');

    const uploadTrend = await File.aggregate([
      { $match: { isDeleted: false, createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          totalSize: { $sum: '$size' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({ success: true, analytics: { byFileType, topUsers, uploadTrend } });
  } catch (error) {
    next(error);
  }
};
