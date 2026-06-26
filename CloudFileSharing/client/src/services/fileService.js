import api from './api';

export const fileService = {
  // Upload
  uploadFiles: (formData, onProgress) =>
    api.post('/files', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    }),

  // Fetch
  getFiles: (params) => api.get('/files', { params }),
  getFile: (id) => api.get(`/files/${id}`),
  getRecentFiles: () => api.get('/files/recent'),
  getTrash: (params) => api.get('/files/trash', { params }),

  // Download
  downloadFile: (id) => api.get(`/files/${id}/download`),

  // Update
  updateFile: (id, data) => api.put(`/files/${id}`, data),

  // Delete
  deleteFile: (id) => api.delete(`/files/${id}`),
  restoreFile: (id) => api.post(`/files/${id}/restore`),
  permanentDelete: (id) => api.delete(`/files/${id}/permanent`),
  emptyTrash: () => api.delete('/files/trash/empty'),

  // Actions
  toggleFavorite: (id) => api.post(`/files/${id}/favorite`),
  duplicateFile: (id) => api.post(`/files/${id}/duplicate`),
};
