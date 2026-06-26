const mongoose = require('mongoose');
const crypto = require('crypto');

const sharedFileSchema = new mongoose.Schema(
  {
    file: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
      required: true,
    },
    folder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
      default: null,
    },
    sharedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Who it's shared with (null = public link)
    sharedWith: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        email: String,
        permission: {
          type: String,
          enum: ['view', 'download', 'edit'],
          default: 'view',
        },
        acceptedAt: Date,
      },
    ],
    // Public link
    publicLink: {
      type: String,
      unique: true,
      sparse: true,
    },
    linkToken: {
      type: String,
      unique: true,
      sparse: true,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    // Permissions
    permissions: {
      canView: { type: Boolean, default: true },
      canDownload: { type: Boolean, default: true },
      canEdit: { type: Boolean, default: false },
    },
    // Security
    password: {
      type: String,
      select: false,
    },
    hasPassword: {
      type: Boolean,
      default: false,
    },
    // Expiry
    expiresAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Stats
    accessCount: {
      type: Number,
      default: 0,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    lastAccessedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Virtual: is expired ───────────────────────────────────────────────────────
sharedFileSchema.virtual('isExpired').get(function () {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// ── Pre-save: generate public link token ──────────────────────────────────────
sharedFileSchema.pre('save', function (next) {
  if (!this.linkToken) {
    this.linkToken = crypto.randomBytes(20).toString('hex');
  }
  this.publicLink = `${process.env.CLIENT_URL}/#/share/${this.linkToken}`;
  next();
});

// ── Indexes ───────────────────────────────────────────────────────────────────
sharedFileSchema.index({ file: 1, sharedBy: 1 });
sharedFileSchema.index({ expiresAt: 1 });
sharedFileSchema.index({ 'sharedWith.user': 1 });

module.exports = mongoose.model('SharedFile', sharedFileSchema);
