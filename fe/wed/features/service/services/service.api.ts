import api from '@/lib/axios';

export const serviceApi = {
  // Public
  search: (params?: Record<string, unknown>) =>
    api.get('/services/search', { params }),

  aiSearch: (query: string) =>
    api.post('/services/ai-search', { query }),

  getById: (id: number) =>
    api.get(`/services/${id}`),

  getReviews: (serviceId: number, params?: Record<string, unknown>) =>
    api.get(`/services/${serviceId}/reviews`, { params }),

  // Provider
  getMyServices: (params?: Record<string, unknown>) =>
    api.get('/services/my', { params }),

  create: (data: FormData) =>
    api.post('/services', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (id: number, data: FormData) =>
    api.patch(`/services/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  submit: (id: number) =>
    api.patch(`/services/${id}/submit`),

  hide: (id: number) =>
    api.patch(`/services/${id}/hide`),

  show: (id: number) =>
    api.patch(`/services/${id}/show`),

  // Featured Listings
  getFeatured: () =>
    api.get('/services/featured'),

  purchaseFeature: (serviceId: number, days: number) =>
    api.post(`/services/${serviceId}/feature`, { days }),

  getMyFeatured: () =>
    api.get('/services/my/featured'),

  // Admin
  adminApprove: (id: number) =>
    api.patch(`/admin/services/${id}/approve`),

  adminReject: (id: number, reason: string) =>
    api.patch(`/admin/services/${id}/reject`, { reason }),

  adminHide: (id: number, reason: string) =>
    api.patch(`/admin/services/${id}/hide`, { reason }),

  // Categories
  getCategories: () =>
    api.get('/categories/tree'),
};
