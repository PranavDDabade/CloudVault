import api from './api';

export const shareService = {
  createShare: (data) => api.post('/share', data),
  getShareByToken: (token, password) =>
    password
      ? api.post(`/share/public/${token}`, { password })
      : api.get(`/share/public/${token}`),
  downloadViaShare: (token, password) =>
    password
      ? api.post(`/share/public/${token}/download`, { password })
      : api.get(`/share/public/${token}/download`),
  getMyShares: () => api.get('/share/mine'),
  getSharedWithMe: () => api.get('/share/shared-with-me'),
  updateShare: (id, data) => api.put(`/share/${id}`, data),
  deleteShare: (id) => api.delete(`/share/${id}`),
};
