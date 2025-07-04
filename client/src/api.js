import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Change if your backend runs on a different port or path
});

// Attach token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
});

export default api; 