const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
      maxlength: [255, 'File name cannot exceed 255 characters'],
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true, // bytes
    },
    extension: {
      type: String,
      lowercase: true,
    },
    // S3 storage
    url: {
      type: String,
      required: true,
    },
    key: {
      type: String,
      required: true,
      unique: true,
    },
    // Ownership
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    folder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
      default: null,
    },
    // File metadata
    fileType: {
      type: String,
      enum: ['image', 'video', 'audio', 'document', 'spreadsheet', 'presentation', 'archive', 'code', 'other'],
      default: 'other',
    },
    thumbnail: {
      type: String,
      default: null,
    },
    // Status
    isFavorite: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    // Stats
    downloadCount: {
      type: Number,
      default: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    // Sharing
    isShared: {
      type: Boolean,
      default: false,
    },
    shareCount: {
      type: Number,
      default: 0,
    },
    // Tags
    tags: [{ type: String, trim: true, lowercase: true }],
    // Color label
    color: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Virtual: human-readable size ─────────────────────────────────────────────
fileSchema.virtual('formattedSize').get(function () {
  const bytes = this.size;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
});

// ── Pre-save: determine file type & extension ─────────────────────────────────
fileSchema.pre('save', function (next) {
  if (this.originalName && !this.extension) {
    this.extension = this.originalName.split('.').pop().toLowerCase();
  }
  if (this.mimeType && !this.fileType) {
    this.fileType = getFileType(this.mimeType);
  }
  next();
});

function getFileType(mimeType) {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return 'spreadsheet';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar') || mimeType.includes('7z')) return 'archive';
  if (mimeType.includes('javascript') || mimeType.includes('json') || mimeType.includes('html') || mimeType.includes('css')) return 'code';
  return 'other';
}

// ── Indexes ───────────────────────────────────────────────────────────────────
fileSchema.index({ owner: 1, isDeleted: 1 });
fileSchema.index({ owner: 1, folder: 1 });
fileSchema.index({ owner: 1, isFavorite: 1 });
fileSchema.index({ owner: 1, fileType: 1 });
fileSchema.index({ name: 'text', originalName: 'text', tags: 'text' });
fileSchema.index({ deletedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // Auto-purge after 30 days

module.exports = mongoose.model('File', fileSchema);
