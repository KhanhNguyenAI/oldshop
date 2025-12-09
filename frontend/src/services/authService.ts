import api from './api';
import type {
  LoginRequest,
  RegisterRequest,
  SendOTPRequest,
  VerifyOTPRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  SendOTPForEmailUpdateRequest,
  UpdateEmailRequest,
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

  // Send OTP for email update
  sendOTPForEmailUpdate: async (data: SendOTPForEmailUpdateRequest): Promise<{ message: string }> => {
    const response = await api.post('/auth/send-otp-email-update/', data);
    return response.data;
  },

  // Update email
  updateEmail: async (data: UpdateEmailRequest): Promise<{ message: string; new_email: string }> => {
    const response = await api.post('/auth/update-email/', data);
    return response.data;
  },
};

