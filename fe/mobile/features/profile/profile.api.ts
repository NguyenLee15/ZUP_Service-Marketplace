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
};
