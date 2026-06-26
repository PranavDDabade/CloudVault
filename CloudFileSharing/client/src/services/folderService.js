import api from './api';

export const folderService = {
  getFolders: (params) => api.get('/folders', { params }),
  getFolder: (id) => api.get(`/folders/${id}`),
  createFolder: (data) => api.post('/folders', data),
  updateFolder: (id, data) => api.put(`/folders/${id}`, data),
  deleteFolder: (id) => api.delete(`/folders/${id}`),
  getBreadcrumb: (id) => api.get(`/folders/${id}/breadcrumb`),
};
