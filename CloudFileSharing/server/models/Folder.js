const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Folder name is required'],
      trim: true,
      maxlength: [100, 'Folder name cannot exceed 100 characters'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
      default: null, // null = root folder
    },
    color: {
      type: String,
      default: '#4F46E5',
    },
    icon: {
      type: String,
      default: 'folder',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    isShared: {
      type: Boolean,
      default: false,
    },
    // Cached stats (updated on file operations)
    fileCount: {
      type: Number,
      default: 0,
    },
    totalSize: {
      type: Number,
      default: 0,
    },
    // Breadcrumb path (denormalized for performance)
    path: [
      {
        id: mongoose.Schema.Types.ObjectId,
        name: String,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Virtual: full path string ─────────────────────────────────────────────────
folderSchema.virtual('fullPath').get(function () {
  const pathNames = this.path ? this.path.map((p) => p.name) : [];
  return '/' + [...pathNames, this.name].join('/');
});

// ── Indexes ───────────────────────────────────────────────────────────────────
folderSchema.index({ owner: 1, parent: 1, isDeleted: 1 });
folderSchema.index({ owner: 1, name: 1 });
folderSchema.index({ name: 'text' });

module.exports = mongoose.model('Folder', folderSchema);
