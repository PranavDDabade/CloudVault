const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      enum: [
        'login',
        'logout',
        'register',
        'upload',
        'download',
        'delete',
        'restore',
        'permanent_delete',
        'rename',
        'move',
        'copy',
        'share',
        'unshare',
        'create_folder',
        'delete_folder',
        'favorite',
        'unfavorite',
        'profile_update',
        'password_change',
        'avatar_update',
        'storage_full_warning',
      ],
      required: true,
    },
    resourceType: {
      type: String,
      enum: ['file', 'folder', 'share', 'user', 'auth'],
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    resourceName: String,
    description: String,
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ip: String,
    userAgent: String,
    status: {
      type: String,
      enum: ['success', 'failed'],
      default: 'success',
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 }); // 180 days

module.exports = mongoose.model('ActivityLog', activityLogSchema);
