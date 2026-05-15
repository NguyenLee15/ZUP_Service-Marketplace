/**
 * Provider Services API
 */
import api from '../../lib/axios';

export const serviceApi = {
  /** GET /services/my/list */
  getMyServices: (params?: { status?: string }) =>
    api.get('/services/my/list', { params }),

  /** PATCH /services/:id/hide */
  hideService: (id: number) => api.patch(`/services/${id}/hide`),

  /** PATCH /services/:id/show */
  showService: (id: number) => api.patch(`/services/${id}/show`),

  /** DELETE /services/:id */
  deleteService: (id: number) => api.delete(`/services/${id}`),

  /** POST /services */
  createService: (formData: FormData) => 
    api.post('/services', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),

  /** PATCH /services/:id */
  updateService: (id: number, formData: FormData) => 
    api.patch(`/services/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),

  /** PATCH /services/:id/submit */
  submitService: (id: number) => api.patch(`/services/${id}/submit`),

  /** GET /services/:id/reviews */
  getReviews: (id: number) => api.get(`/services/${id}/reviews`),

  /** GET /categories/flat */
  getCategories: () => api.get('/categories/flat'),
};
