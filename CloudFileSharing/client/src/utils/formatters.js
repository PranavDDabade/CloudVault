import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

/**
 * Format bytes into human-readable size
 */
export const formatBytes = (bytes, decimals = 1) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
};

/**
 * Format a date relative to now, with full date fallback
 */
export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isToday(d)) return `Today at ${format(d, 'h:mm a')}`;
  if (isYesterday(d)) return `Yesterday at ${format(d, 'h:mm a')}`;
  if (Date.now() - d.getTime() < 7 * 24 * 60 * 60 * 1000) {
    return formatDistanceToNow(d, { addSuffix: true });
  }
  return format(d, 'MMM d, yyyy');
};

/**
 * Format short date
 */
export const formatShortDate = (date) => {
  if (!date) return '';
  return format(new Date(date), 'MMM d, yyyy');
};

/**
 * Format storage as a percentage string
 */
export const formatStoragePercent = (used, limit) => {
  if (!limit) return '0%';
  return `${Math.round((used / limit) * 100)}%`;
};

/**
 * Truncate filename preserving extension
 */
export const truncateFilename = (name, maxLen = 30) => {
  if (!name || name.length <= maxLen) return name;
  const ext = name.includes('.') ? `.${name.split('.').pop()}` : '';
  const base = name.slice(0, name.length - ext.length);
  return `${base.slice(0, maxLen - ext.length - 3)}...${ext}`;
};

/**
 * Format number with K/M suffixes
 */
export const formatCount = (n) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

/**
 * Merge class names (clsx-style)
 */
export const cn = (...classes) => classes.filter(Boolean).join(' ');
