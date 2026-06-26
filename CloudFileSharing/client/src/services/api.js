import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Set Auth Token ────────────────────────────────────────────────────────────
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// ── Request Interceptor ───────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cloudvault_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor ──────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    if (error.response?.status === 401) {
      localStorage.removeItem('cloudvault_token');
      delete api.defaults.headers.common['Authorization'];
      
      // Only redirect if not already on auth or public pages
      const isPublicPath = 
        window.location.hash.startsWith('#/login') ||
        window.location.hash.startsWith('#/register') ||
        window.location.hash.startsWith('#/share/') ||
        window.location.hash.startsWith('#/reset-password') ||
        window.location.hash.startsWith('#/forgot-password');

      if (!isPublicPath) {
        window.location.href = '/#/login';
      }
    } else if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action.');
    } else if (error.response?.status === 413) {
      toast.error('File too large. Please check your storage limit.');
    } else if (error.response?.status >= 500) {
      toast.error(message || 'Server error. Please try again later.');
    }

    return Promise.reject({ ...error, message });
  }
);

export default api;
