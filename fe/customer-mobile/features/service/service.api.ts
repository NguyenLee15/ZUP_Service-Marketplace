import api from '../../lib/axios';

export const serviceApi = {
  search: (params?: Record<string, unknown>) => api.get('/services/search', { params }),
  aiSearch: (query: string, lat?: number, lng?: number) => api.post('/services/ai-search', { query, lat, lng }),
  getFeatured: () => api.get('/services/featured'),
  getById: (id: number) => api.get(`/services/${id}`),
  getReviews: (serviceId: number, params?: Record<string, unknown>) =>
    api.get(`/services/${serviceId}/reviews`, { params }),
  getProviderProfile: (providerId: number) => api.get(`/services/providers/${providerId}`),
  getProviderServices: (providerId: number, params?: Record<string, unknown>) =>
    api.get(`/services/providers/${providerId}/services`, { params }),
  getProviderStats: (serviceId: number) => api.get(`/services/${serviceId}/provider-stats`),
  getCategories: () => api.get('/categories/tree'),
  getFlatCategories: () => api.get('/categories/flat'),
  generateDescription: (data: { name: string; keywords?: string }) => api.post('/services/ai-generate-description', data),
};

