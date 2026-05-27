import api from '../../lib/axios';

export const userApi = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: FormData) =>
    api.patch('/users/profile', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', data),
  getAddresses: () => api.get('/users/addresses'),
  createAddress: (data: Record<string, unknown>) => api.post('/users/addresses', data),
  updateAddress: (id: number, data: Record<string, unknown>) =>
    api.patch(`/users/addresses/${id}`, data),
  deleteAddress: (id: number) => api.delete(`/users/addresses/${id}`),
  setDefaultAddress: (id: number) => api.patch(`/users/addresses/${id}/default`),
};
