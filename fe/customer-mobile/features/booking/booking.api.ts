import api from "../../lib/axios";
import * as Crypto from "expo-crypto";

function createUuidV4(): string {
  return Crypto.randomUUID();
}

export const bookingApi = {
  create: (data: Record<string, unknown>, idempotencyKey = createUuidV4()) =>
    api.post("/bookings", data, {
      headers: { "Idempotency-Key": idempotencyKey },
    }),
  getMyBookings: (params?: Record<string, unknown>) =>
    api.get("/bookings", { params }),
  getById: (id: number) => api.get(`/bookings/${id}`),
  getTrackingLocation: (id: number) =>
    api.get(`/bookings/${id}/tracking/location`),
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
  confirmSupplementaryQuote: (id: number, quoteId: number) =>
    api.patch(`/bookings/${id}/supplementary-quotes/${quoteId}/confirm`),
  rejectSupplementaryQuote: (id: number, quoteId: number, reason?: string) =>
    api.patch(`/bookings/${id}/supplementary-quotes/${quoteId}/reject`, { reason }),
  dispute: (id: number, data: FormData) =>
    api.post(`/bookings/${id}/dispute`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  rebook: (id: number) => api.post(`/bookings/${id}/rebook`),
};
