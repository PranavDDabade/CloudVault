/**
 * Misc helper utilities
 */

/**
 * Format bytes to human-readable size
 */
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

/**
 * Get file category from MIME type
 */
const getFileCategory = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf')) return 'document';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet') || mimeType.includes('csv')) return 'spreadsheet';
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'presentation';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z') || mimeType.includes('tar')) return 'archive';
  if (mimeType.includes('text') || mimeType.includes('json') || mimeType.includes('javascript')) return 'code';
  return 'other';
};

/**
 * Generate a unique S3 key for a file
 */
const generateS3Key = (userId, filename) => {
  const uuid = require('uuid').v4();
  const ext = filename.split('.').pop().toLowerCase();
  const timestamp = Date.now();
  return `users/${userId}/${timestamp}-${uuid}.${ext}`;
};

/**
 * Paginate helper
 */
const paginate = (query, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  return { skip, limit: parseInt(limit), page: parseInt(page) };
};

/**
 * Build pagination response meta
 */
const getPaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

/**
 * Strip HTML from string
 */
const stripHtml = (str) => str.replace(/<[^>]*>/g, '');

/**
 * Sanitize filename
 */
const sanitizeFilename = (filename) => {
  return filename
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, '_')
    .substring(0, 255);
};

/**
 * Log activity helper
 */
const logActivity = async (data) => {
  try {
    const ActivityLog = require('../models/ActivityLog');
    await ActivityLog.create(data);
  } catch (err) {
    console.error('Activity log error:', err.message);
  }
};

/**
 * Create notification helper
 */
const createNotification = async (data) => {
  try {
    const Notification = require('../models/Notification');
    await Notification.create(data);
  } catch (err) {
    console.error('Notification create error:', err.message);
  }
};

module.exports = {
  formatBytes,
  getFileCategory,
  generateS3Key,
  paginate,
  getPaginationMeta,
  stripHtml,
  sanitizeFilename,
  logActivity,
  createNotification,
};
