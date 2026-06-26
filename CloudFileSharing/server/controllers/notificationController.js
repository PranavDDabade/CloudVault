const Notification = require('../models/Notification');
const { getPaginationMeta, paginate } = require('../utils/helpers');

// ── Get Notifications ──────────────────────────────────────────────────────────
exports.getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const query = { user: req.user._id };
    if (unreadOnly === 'true') query.isRead = false;

    const { skip, limit: limitNum } = paginate(query, page, limit);
    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });

    const notifications = await Notification.find(query)
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum)
      .lean();

    res.status(200).json({
      success: true,
      notifications,
      unreadCount,
      pagination: getPaginationMeta(total, parseInt(page), limitNum),
    });
  } catch (error) {
    next(error);
  }
};

// ── Mark as Read ───────────────────────────────────────────────────────────────
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found.' });
    res.status(200).json({ success: true, notification });
  } catch (error) {
    next(error);
  }
};

// ── Mark All as Read ───────────────────────────────────────────────────────────
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
};

// ── Delete Notification ────────────────────────────────────────────────────────
exports.deleteNotification = async (req, res, next) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.status(200).json({ success: true, message: 'Notification deleted.' });
  } catch (error) {
    next(error);
  }
};

// ── Delete All Notifications ───────────────────────────────────────────────────
exports.clearAllNotifications = async (req, res, next) => {
  try {
    await Notification.deleteMany({ user: req.user._id });
    res.status(200).json({ success: true, message: 'All notifications cleared.' });
  } catch (error) {
    next(error);
  }
};
