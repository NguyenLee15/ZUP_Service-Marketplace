/**
 * User Profile API
 */
import api from '../../lib/axios';

export const profileApi = {
  /** GET /users/profile */
  getProfile: () => api.get('/users/profile'),

  /** PATCH /users/profile */
  updateProfile: (formData: FormData) => 
    api.patch('/users/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),

  /** GET /users/kyc */
  getKycStatus: () => api.get('/users/kyc'),

  /** POST /users/kyc */
  submitKyc: (formData: FormData) => 
    api.post('/users/kyc', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),

  // ===== ADDRESSES =====
  getAddresses: () => api.get('/users/addresses'),
  createAddress: (data: any) => api.post('/users/addresses', data),
  updateAddress: (id: number, data: any) => api.patch(`/users/addresses/${id}`, data),
  deleteAddress: (id: number) => api.delete(`/users/addresses/${id}`),
  setDefaultAddress: (id: number) => api.patch(`/users/addresses/${id}/default`),

  updateOnlineStatus: (isOnline: boolean) => api.patch('/users/profile/online-status', { isOnline }),
};
