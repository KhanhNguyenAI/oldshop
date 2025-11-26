import api from './api';
import type {
  LoginRequest,
  RegisterRequest,
  SendOTPRequest,
  VerifyOTPRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  AuthResponse,
  User,
} from '../types/auth';

export const authService = {
  // Send OTP
  sendOTP: async (data: SendOTPRequest): Promise<{ message: string }> => {
    const response = await api.post('/auth/send-otp/', data);
    return response.data;
  },

  // Verify OTP
  verifyOTP: async (data: VerifyOTPRequest): Promise<{ message: string }> => {
    const response = await api.post('/auth/verify-otp/', data);
    return response.data;
  },

  // Register
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/register/', data);
    return response.data;
  },

  // Login
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/login/', data);
    return response.data;
  },

  // Refresh token
  refreshToken: async (): Promise<{ access_token: string }> => {
    const response = await api.post('/auth/refresh/');
    return response.data;
  },

  // Logout
  logout: async (): Promise<{ message: string }> => {
    const response = await api.post('/auth/logout/');
    return response.data;
  },

  // Get current user
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me/');
    return response.data;
  },

  // Reset password
  resetPassword: async (data: ResetPasswordRequest): Promise<{ message: string }> => {
    const response = await api.post('/auth/reset-password/', data);
    return response.data;
  },

  // Change password (for authenticated users)
  changePassword: async (data: ChangePasswordRequest): Promise<{ message: string }> => {
    const response = await api.post('/auth/change-password/', data);
    return response.data;
  },
};

