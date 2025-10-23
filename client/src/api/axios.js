import axios from 'axios';

// ✅ Jangan set baseURL - biarkan proxy yang handle
const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('📡 Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('✅ Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ Response error:', error.response?.status, error.config?.url);
    
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;
export const API_URL = ''; // Empty string untuk proxy mode