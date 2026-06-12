import api from '../../lib/axios';

export const authApi = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),

  googleLogin: (data: { credential: string }) => api.post('/auth/google', data),

  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),

  register: (data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    role: 'CUSTOMER';
  }) => api.post('/auth/register', data),

  verifyOtp: (data: { email: string; otp: string }) => api.post('/auth/verify-otp', data),

  resendOtp: (email: string) => api.post('/auth/resend-otp', { email }),

  forgotPassword: (data: { email: string }) => api.post('/auth/forgot-password', data),

  getProfile: () => api.get('/auth/profile'),

  updatePushToken: (token: string) => api.patch('/users/profile/push-token', { token }),

  logout: () => api.post('/auth/logout'),
};
