import api from "../../lib/axios";

export const bookingApi = {
  create: (data: Record<string, unknown>) => api.post("/bookings", data),
  getMyBookings: (params?: Record<string, unknown>) =>
    api.get("/bookings", { params }),
  getById: (id: number) => api.get(`/bookings/${id}`),
  exportHistoryPdf: (params?: Record<string, unknown>) =>
    api.get("/bookings/export-pdf", { params, responseType: "arraybuffer" }),
  exportReceiptPdf: (id: number) =>
    api.get(`/bookings/${id}/receipt-pdf`, { responseType: "arraybuffer" }),
  getTimeline: (id: number) => api.get(`/bookings/${id}/timeline`),
  confirmQuote: (id: number) => api.patch(`/bookings/${id}/confirm-quote`),
  rejectQuote: (id: number, reason: string) =>
    api.patch(`/bookings/${id}/reject-quote`, { reason }),
  cancelByCustomer: (id: number, reason: string) =>
    api.patch(`/bookings/${id}/cancel`, { reason }),
  acceptCompletion: (id: number) => api.patch(`/bookings/${id}/accept`),
  dispute: (id: number, data: FormData) =>
    api.post(`/bookings/${id}/dispute`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  rebook: (id: number) => api.post(`/bookings/${id}/rebook`),
};
