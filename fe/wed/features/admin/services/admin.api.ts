import api from '@/lib/axios';

export const adminApi = {
  // Services
  getServices: (params?: Record<string, ApiPayload>) =>
    api.get('/admin/services', { params }),

  approveService: (id: number) =>
    api.patch(`/admin/services/${id}/approve`),

  rejectService: (id: number, reason: string) =>
    api.patch(`/admin/services/${id}/reject`, { reason }),

  hideService: (id: number) =>
    api.patch(`/admin/services/${id}/hide`),

  // Disputes
  resolveDispute: (id: number, resolution: string, refundPercent: number) =>
    api.patch(`/admin/disputes/${id}/resolve`, { resolution, refundPercent }),

  // Bookings
  getBookings: (params?: Record<string, ApiPayload>) =>
    api.get('/admin/bookings', { params }),

  // Users
  getUsers: (params?: Record<string, ApiPayload>) =>
    api.get('/admin/users', { params }),

  lockUser: (id: number, data?: { reason: string }) =>
    api.patch(`/admin/users/${id}/lock`, data),

  unlockUser: (id: number) =>
    api.patch(`/admin/users/${id}/unlock`),

  // KYC
  getKycRequests: (params?: Record<string, ApiPayload>) =>
    api.get('/admin/kyc', { params }),

  getKycDetail: (id: number) =>
    api.get(`/admin/kyc/${id}`),

  approveKyc: (id: number) =>
    api.patch(`/admin/kyc/${id}/approve`),

  rejectKyc: (id: number, reason: string) =>
    api.patch(`/admin/kyc/${id}/reject`, { reason }),

  // Categories
  createCategory: (data: ApiPayload) =>
    api.post('/categories', data),

  updateCategory: (id: number, data: ApiPayload) =>
    api.patch(`/categories/${id}`, data),

  deleteCategory: (id: number) =>
    api.delete(`/categories/${id}`),

  // Dashboard stats
  getDashboardStats: () =>
    api.get('/admin/dashboard/stats'),
};
