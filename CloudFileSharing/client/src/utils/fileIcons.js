/**
 * Get icon name and color for a file based on its type/extension
 */
export const getFileIcon = (file) => {
  const mimeType = file?.mimeType || '';
  const ext = (file?.extension || file?.name?.split('.').pop() || '').toLowerCase();
  const fileType = file?.fileType || '';

  // Images
  if (fileType === 'image' || mimeType.startsWith('image/')) {
    return { icon: 'image', color: '#EC4899', bg: 'rgba(236,72,153,0.1)' };
  }
  // Videos
  if (fileType === 'video' || mimeType.startsWith('video/')) {
    return { icon: 'video', color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' };
  }
  // Audio
  if (fileType === 'audio' || mimeType.startsWith('audio/')) {
    return { icon: 'music', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' };
  }
  // PDFs
  if (ext === 'pdf' || mimeType.includes('pdf')) {
    return { icon: 'file-text', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' };
  }
  // Word docs
  if (['doc', 'docx'].includes(ext) || mimeType.includes('word')) {
    return { icon: 'file-text', color: '#2563EB', bg: 'rgba(37,99,235,0.1)' };
  }
  // Excel / CSV
  if (['xls', 'xlsx', 'csv'].includes(ext) || fileType === 'spreadsheet') {
    return { icon: 'table', color: '#10B981', bg: 'rgba(16,185,129,0.1)' };
  }
  // PowerPoint
  if (['ppt', 'pptx'].includes(ext) || fileType === 'presentation') {
    return { icon: 'presentation', color: '#F97316', bg: 'rgba(249,115,22,0.1)' };
  }
  // Archives
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) || fileType === 'archive') {
    return { icon: 'archive', color: '#6B7280', bg: 'rgba(107,114,128,0.1)' };
  }
  // Code files
  if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'py', 'java', 'php', 'cpp', 'c', 'go', 'rb', 'rs'].includes(ext) || fileType === 'code') {
    return { icon: 'code', color: '#06B6D4', bg: 'rgba(6,182,212,0.1)' };
  }
  // Text
  if (['txt', 'md', 'rtf'].includes(ext)) {
    return { icon: 'file-text', color: '#94A3B8', bg: 'rgba(148,163,184,0.1)' };
  }

  // Default
  return { icon: 'file', color: '#4F46E5', bg: 'rgba(79,70,229,0.1)' };
};

/**
 * Check if a file is previewable in browser
 */
export const isPreviewable = (file) => {
  const mimeType = file?.mimeType || '';
  return (
    mimeType.startsWith('image/') ||
    mimeType.startsWith('video/') ||
    mimeType.startsWith('audio/') ||
    mimeType === 'application/pdf' ||
    mimeType.startsWith('text/')
  );
};

/**
 * Get file type label
 */
export const getFileTypeLabel = (fileType) => {
  const labels = {
    image: 'Image',
    video: 'Video',
    audio: 'Audio',
    document: 'Document',
    spreadsheet: 'Spreadsheet',
    presentation: 'Presentation',
    archive: 'Archive',
    code: 'Code',
    other: 'File',
  };
  return labels[fileType] || 'File';
};

/**
 * All file type filter options
 */
export const FILE_TYPE_FILTERS = [
  { label: 'All Files', value: '' },
  { label: 'Images', value: 'image' },
  { label: 'Videos', value: 'video' },
  { label: 'Audio', value: 'audio' },
  { label: 'Documents', value: 'document' },
  { label: 'Spreadsheets', value: 'spreadsheet' },
  { label: 'Presentations', value: 'presentation' },
  { label: 'Archives', value: 'archive' },
  { label: 'Code', value: 'code' },
];
