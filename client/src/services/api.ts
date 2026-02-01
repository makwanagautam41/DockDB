/**
 * API Service - Central Axios configuration for backend communication
 */

import axios, { AxiosError, AxiosInstance } from 'axios';

// Create Axios instance with base configuration
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  withCredentials: true, // Enable cookies for session management
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data: any = error.response.data;

      console.error(`API Error [${status}]:`, data);

      // Handle specific status codes
      switch (status) {
        case 401:
          console.error('Unauthorized - Authentication required');
          break;
        case 403:
          console.error('Forbidden - Access denied');
          break;
        case 404:
          console.error('Not found');
          break;
        case 429:
          console.error('Too many requests - Rate limit exceeded');
          break;
        case 500:
          console.error('Internal server error');
          break;
      }

      // Return formatted error
      return Promise.reject({
        message: data?.error?.message || data?.message || 'An error occurred',
        code: data?.error?.code || 'UNKNOWN_ERROR',
        status,
      });
    } else if (error.request) {
      // Request made but no response received
      console.error('Network Error: No response from server');
      return Promise.reject({
        message: 'Unable to connect to server. Please check your connection.',
        code: 'NETWORK_ERROR',
      });
    } else {
      // Something else happened
      console.error('Request Error:', error.message);
      return Promise.reject({
        message: error.message || 'An unexpected error occurred',
        code: 'REQUEST_ERROR',
      });
    }
  }
);

export default api;
