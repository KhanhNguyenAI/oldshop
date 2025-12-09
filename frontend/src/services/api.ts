import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for cookies
});

// Request interceptor - Add access token to headers
api.interceptors.request.use(
  (config) => {
    // Get access token from memory (will be set by auth context)
    const accessToken = (window as any).__accessToken;
    
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    // If we get a successful response, backend is up - clear the flag
    (window as any).__backendDown = false;
    return response;
  },
  async (error: any) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Don't retry refresh token if the request itself is to refresh endpoint
    const isRefreshRequest = originalRequest.url?.includes('/auth/refresh/');
    
    // Don't retry if we're on login/register page
    const isAuthPage = window.location.pathname === '/ReHomeMarket/login' || window.location.pathname === '/ReHomeMarket/register';

    // Handle network errors (backend not running) - don't retry
    if (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED') || !error.response) {
      // If it's a refresh request and backend is down, clear token and stop
      if (isRefreshRequest) {
        (window as any).__accessToken = null;
        (window as any).__backendDown = true; // Flag to prevent further refresh attempts
        return Promise.reject(error);
      }
      // For other requests, just reject without retry
      return Promise.reject(error);
    }

    // If error is 401 and we haven't tried to refresh yet
    // Skip if it's a refresh request or we're on auth pages
    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshRequest && !isAuthPage) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Check if backend was previously down - if so, don't retry
        if ((window as any).__backendDown) {
          throw new Error('Backend is not available');
        }

        // Try to refresh token
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/refresh/`,
          {},
          { withCredentials: true }
        );

        // Backend is up, clear the flag
        (window as any).__backendDown = false;

        const { access_token } = refreshResponse.data;
        
        // Update access token in memory
        (window as any).__accessToken = access_token;
        
        // Update authorization header
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }

        processQueue(null, access_token);

        return api(originalRequest);
      } catch (refreshError: any) {
        processQueue(refreshError as Error, null);
        
        // If it's a network error, mark backend as down
        if (refreshError.code === 'ECONNREFUSED' || refreshError.message?.includes('ECONNREFUSED') || !refreshError.response) {
          (window as any).__backendDown = true;
        }
        
        // Clear access token
        (window as any).__accessToken = null;
        
        // Redirect to login if refresh fails (but not if already on login/register page)
        const currentPath = window.location.pathname;
        if (currentPath !== '/ReHomeMarket/login' && currentPath !== '/ReHomeMarket/register') {
          window.location.href = '/ReHomeMarket/login';
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

