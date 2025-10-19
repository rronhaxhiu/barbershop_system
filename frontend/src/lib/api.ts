import axios from 'axios';
import { authUtils } from './auth';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable CORS credentials
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    // Add JWT token to requests if available
    const token = authUtils.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', error.response.status, error.response.data);
      
      // Handle specific error codes
      switch (error.response.status) {
        case 401:
          // Unauthorized - redirect to login if on admin page
          console.error('Unauthorized:', error.response.data);
          if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
            authUtils.logout();
          }
          break;
        case 400:
          console.error('Bad Request:', error.response.data);
          break;
        case 404:
          console.error('Not Found:', error.response.data);
          break;
        case 500:
          console.error('Server Error:', error.response.data);
          break;
        default:
          console.error('Error:', error.response.data);
      }
    } else if (error.request) {
      // Request made but no response received
      console.error('Network Error: No response received from server');
      console.error('Request:', error.request);
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;

