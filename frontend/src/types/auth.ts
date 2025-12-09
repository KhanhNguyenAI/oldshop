// User Profile Types
export interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  phone_number: string;
  avatar_url: string | null;
}

// Payment / Card Types (VISA, Mastercard...)
export type PaymentBrand = 'visa' | 'mastercard' | 'jcb' | 'amex' | 'other';

export interface PaymentMethod {
  id: number;
  brand: PaymentBrand;
  brand_display: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  card_holder_name: string;
  gateway: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Address {
  id: number;
  recipient: string;
  postal_code: string;
  prefecture: string;
  city: string;
  district: string;
  building: string;
  phone: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  email: string;
  is_email_verified: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
  created_at: string;
  profile?: UserProfile;
}

// Auth Request Types
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

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface SendOTPForEmailUpdateRequest {
  email: string;
}

export interface UpdateEmailRequest {
  current_password: string;
  new_email: string;
  otp_code: string;
}

// Auth Response Types
export interface AuthResponse {
  message: string;
  user: User;
  access_token: string;
}

// Auth Context Type
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
  refreshProfile: () => Promise<void>;
}
