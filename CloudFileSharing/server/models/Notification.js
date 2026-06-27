const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'upload_success',
        'upload_failed',
        'file_shared',
        'folder_shared',
        'file_deleted',
        'file_restored',
        'storage_warning',
        'storage_full',
        'share_accepted',
        'share_declined',
        'new_comment',
        'system',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    message: {
      type: String,
      required: true,
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    // Reference to related resource
    metadata: {
      fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
      folderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder' },
      shareId: { type: mongoose.Schema.Types.ObjectId, ref: 'SharedFile' },
      fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      link: String,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // 90 days

module.exports = mongoose.model('Notification', notificationSchema);
