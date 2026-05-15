import api from '@/lib/axios';

export const userApi = {
  getProfile: () =>
    api.get('/users/profile'),

  updateProfile: (data: FormData) =>
    api.patch('/users/profile', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  changePassword: (dto: { currentPassword: string; newPassword: string }) =>
    api.patch('/users/change-password', dto),

  // Addresses
  getAddresses: () =>
    api.get('/users/addresses'),

  createAddress: (dto: Record<string, unknown>) =>
    api.post('/users/addresses', dto),

  updateAddress: (id: number, dto: Record<string, unknown>) =>
    api.patch(`/users/addresses/${id}`, dto),

  deleteAddress: (id: number) =>
    api.delete(`/users/addresses/${id}`),

  setDefaultAddress: (id: number) =>
    api.patch(`/users/addresses/${id}/default`),

  // KYC
  submitKyc: (data: FormData) =>
    api.post('/users/kyc', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getKycStatus: () =>
    api.get('/users/kyc'),
};
