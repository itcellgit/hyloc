import axios from 'axios';
import { authService } from './auth';

// Determine API URL based on current origin
let API_BASE_URL = process.env.REACT_APP_API_URL;

if (!API_BASE_URL) {
  // Get the API server from environment or construct from current origin
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  
  // Check if it's production (hyloc.git.edu)
  if (hostname === 'hyloc.git.edu') {
    // Production: nginx proxies /api to backend
    API_BASE_URL = `${protocol}//${hostname}/api`;
  } else {
    // Development (localhost) or Intranet: direct to port 5000
    API_BASE_URL = `${protocol}//${hostname}:5000/api`;
  }
}

console.log('API Base URL:', API_BASE_URL); // Debug log
console.log('Current hostname:', window.location.hostname);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add authentication token to all requests
api.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      authService.removeToken();
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// User endpoints
export const userService = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  create: (userData) => api.post('/users', userData),
  update: (id, userData) => api.put(`/users/${id}`, userData),
  delete: (id) => api.delete(`/users/${id}`),
  changePassword: (id, passwordData) => api.put(`/users/${id}/password`, passwordData),
};

// Department endpoints
export const departmentService = {
  getAll: () => api.get('/departments'),
  getById: (id) => api.get(`/departments/${id}`),
  create: (departmentData) => api.post('/departments', departmentData),
  update: (id, departmentData) => api.put(`/departments/${id}`, departmentData),
  delete: (id) => api.delete(`/departments/${id}`),
};

// Pillers endpoints
export const pillerService = {
  getAll: () => api.get('/pillers'),
  getById: (id) => api.get(`/pillers/${id}`),
  create: (data) => api.post('/pillers', data),
  update: (id, data) => api.put(`/pillers/${id}`, data),
  delete: (id) => api.delete(`/pillers/${id}`),
};

export default api;
