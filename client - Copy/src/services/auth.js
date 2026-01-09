import api from './api';

export const authService = {
  login: (empid, password) => 
    api.post('/auth/login', { empid, password }),
  
  register: (user) => 
    api.post('/auth/register', user),
  
  logout: () => 
    api.post('/auth/logout'),
  
  verify: (token) => 
    api.get('/auth/verify', {
      headers: { Authorization: `Bearer ${token}` }
    }),

  setToken: (token) => {
    localStorage.setItem('authToken', token);
  },

  getToken: () => {
    return localStorage.getItem('authToken');
  },

  removeToken: () => {
    localStorage.removeItem('authToken');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  }
};
