/**
 * Auth API — đồng bộ với backend endpoints
 */
import api from '../../lib/axios';

export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  register: (data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    role: 'PROVIDER';
  }) => api.post('/auth/register', data),

  verifyOtp: (data: { email: string; otp: string }) =>
    api.post('/auth/verify-otp', data),

  resendOtp: (email: string) =>
    api.post('/auth/resend-otp', { email }),

  getProfile: () => api.get('/auth/profile'),

  updateProfile: (data: FormData) =>
    api.patch('/users/profile', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
  }) => api.post('/auth/change-password', data),

  logout: () => api.post('/auth/logout'),

  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),

  providerGoogleAuth: (credential: string) =>
    api.post('/auth/provider/google', { credential }),

  submitKyc: (data: FormData) =>
    api.post('/users/kyc', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getKycStatus: () => api.get('/users/kyc'),

  updatePushToken: (token: string) =>
    api.patch('/users/profile/push-token', { token }),
};
