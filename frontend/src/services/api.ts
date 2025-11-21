import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
  (response) => response,
  async (error: any) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Don't retry refresh token if the request itself is to refresh endpoint
    const isRefreshRequest = originalRequest.url?.includes('/auth/refresh/');
    
    // Don't retry if we're on login/register page
    const isAuthPage = window.location.pathname === '/login' || window.location.pathname === '/register';

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
        // Try to refresh token
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/refresh/`,
          {},
          { withCredentials: true }
        );

        const { access_token } = refreshResponse.data;
        
        // Update access token in memory
        (window as any).__accessToken = access_token;
        
        // Update authorization header
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }

        processQueue(null, access_token);

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        
        // Clear access token
        (window as any).__accessToken = null;
        
        // Redirect to login if refresh fails (but not if already on login/register page)
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/register') {
          window.location.href = '/login';
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

