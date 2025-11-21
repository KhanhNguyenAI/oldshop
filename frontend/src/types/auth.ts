export interface User {
  id: number;
  email: string;
  is_email_verified: boolean;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  otp_code: string;
}

export interface SendOTPRequest {
  email: string;
}

export interface VerifyOTPRequest {
  email: string;
  otp_code: string;
}

export interface ResetPasswordRequest {
  email: string;
  password: string;
  otp_code: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  access_token: string;
}

export interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, otpCode: string) => Promise<void>;
  logout: () => Promise<void>;
  sendOTP: (email: string) => Promise<void>;
  verifyOTP: (email: string, otpCode: string) => Promise<void>;
  refreshToken: () => Promise<void>;
}
