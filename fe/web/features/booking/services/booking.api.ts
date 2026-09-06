import api from '@/lib/axios';

export const bookingApi = {
  // Customer
  create: (dto: Record<string, unknown>) =>
    api.post('/bookings', dto),

  getMyBookings: (params?: Record<string, unknown>) =>
    api.get('/bookings', { params }),

  getById: (id: number) =>
    api.get(`/bookings/${id}`),

  confirmQuote: (id: number) =>
    api.patch(`/bookings/${id}/confirm-quote`),

  rejectQuote: (id: number, reason: string) =>
    api.patch(`/bookings/${id}/reject-quote`, { reason }),

  confirmSupplementaryQuote: (id: number, quoteId: number) =>
    api.patch(`/bookings/${id}/supplementary-quotes/${quoteId}/confirm`),

  rejectSupplementaryQuote: (id: number, quoteId: number, reason: string) =>
    api.patch(`/bookings/${id}/supplementary-quotes/${quoteId}/reject`, { reason }),

  cancelByCustomer: (id: number, reason: string) =>
    api.patch(`/bookings/${id}/cancel`, { reason }),

  acceptCompletion: (id: number) =>
    api.patch(`/bookings/${id}/accept`),

  dispute: (id: number, data: FormData) =>
    api.post(`/bookings/${id}/dispute`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  rebook: (id: number) =>
    api.post(`/bookings/${id}/rebook`),

  getTimeline: (id: number) =>
    api.get(`/bookings/${id}/timeline`),

  exportPdf: (params?: Record<string, unknown>) =>
    api.get('/bookings/export-pdf', { params, responseType: 'blob' }),

  exportReceiptPdf: (id: number) =>
    api.get(`/bookings/${id}/receipt-pdf`, { responseType: 'blob' }),

  // Provider
  getProviderBookings: (params?: Record<string, unknown>) =>
    api.get('/bookings/provider', { params }),

  confirmSurveyor: (id: number, dto: { surveyorName: string; surveyorPhone: string }) =>
    api.patch(`/bookings/${id}/surveyor`, dto),

  sendQuote: (id: number, data: FormData) =>
    api.post(`/bookings/${id}/quote`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  startWork: (id: number) =>
    api.patch(`/bookings/${id}/start`),

  completeWork: (id: number, data: FormData) =>
    api.patch(`/bookings/${id}/complete`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  cancelByProvider: (id: number, reason: string) =>
    api.patch(`/bookings/${id}/provider-cancel`, { reason }),
};
