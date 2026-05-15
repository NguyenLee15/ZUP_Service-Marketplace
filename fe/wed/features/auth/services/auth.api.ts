import api from '@/lib/axios';

export interface RegisterDto {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface VerifyOtpDto {
  email: string;
  otp: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

/**
 * Auth API service — tất cả auth endpoints.
 * Luồng: hooks/use-auth.ts → auth.api.ts → lib/axios.ts
 */
export const authApi = {
  register: (dto: RegisterDto) =>
    api.post('/auth/register', dto),

  verifyOtp: (dto: VerifyOtpDto) =>
    api.post('/auth/verify-otp', dto),

  resendOtp: (email: string) =>
    api.post('/auth/resend-otp', { email }),

  login: (dto: LoginDto) =>
    api.post('/auth/login', dto),

  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),

  logout: () =>
    api.post('/auth/logout'),

  forgotPassword: (dto: ForgotPasswordDto) =>
    api.post('/auth/forgot-password', dto),

  resetPassword: (dto: ResetPasswordDto) =>
    api.post('/auth/reset-password', dto),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', data),

  googleAuth: (credential: string) =>
    api.post('/auth/google', { credential }),

  getProfile: () =>
    api.get('/auth/profile'),
};
