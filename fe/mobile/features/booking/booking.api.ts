/**
 * Booking API — Provider endpoints
 */
import api from "../../lib/axios";

export const bookingApi = {
  /** GET /provider/bookings — Danh sách booking của NCC */
  getMyBookings: (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) => api.get("/provider/bookings", { params }),

  /** GET /provider/bookings/:id — Chi tiết booking */
  getById: (id: number) => api.get(`/provider/bookings/${id}`),

  /** GET /provider/bookings/:id/timeline — Timeline trạng thái */
  getTimeline: (id: number) => api.get(`/provider/bookings/${id}/timeline`),

  /** PATCH /provider/bookings/:id/accept — Nhận đơn mới */
  acceptBooking: (id: number) => api.patch(`/provider/bookings/${id}/accept`),

  /** PATCH /provider/bookings/:id/decline — Từ chối đơn mới */
  declineBooking: (id: number, data: { reason: string }) =>
    api.patch(`/provider/bookings/${id}/decline`, data),

  /** PATCH /provider/bookings/:id/surveyor — Xác nhận thợ khảo sát */
  confirmSurveyor: (
    id: number,
    data: { surveyorName: string; surveyorPhone: string },
  ) => api.patch(`/provider/bookings/${id}/surveyor`, data),

  /** POST /provider/bookings/:id/quote — Gửi báo giá */
  sendQuote: (id: number, formData: FormData) =>
    api.post(`/provider/bookings/${id}/quote`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  /** POST /provider/bookings/:id/supplementary-quotes — Gửi báo giá phát sinh */
  sendSupplementaryQuote: (
    id: number,
    data: { note?: string; items: any[] },
  ) => api.post(`/provider/bookings/${id}/supplementary-quotes`, data),

  /** PATCH /provider/bookings/:id/arrive — Báo đã đến nơi */
  arriveAtLocation: (id: number) => api.patch(`/provider/bookings/${id}/arrive`),

  /** PATCH /provider/bookings/:id/start — Bắt đầu thực hiện */
  startWork: (id: number) => api.patch(`/provider/bookings/${id}/start`),

  /** PATCH /provider/bookings/:id/complete — Hoàn thành + upload ảnh */
  completeWork: (id: number, formData: FormData) =>
    api.patch(`/provider/bookings/${id}/complete`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  /** PATCH /provider/bookings/:id/cancel — Hủy đơn */
  cancelBooking: (id: number, data: { reason: string }) =>
    api.patch(`/provider/bookings/${id}/cancel`, data),
};

export const dashboardApi = {
  /** GET /provider/dashboard/stats — Thống kê dashboard */
  getStats: (params?: Record<string, string>) =>
    api.get("/provider/dashboard/stats", { params }),

  /** GET /provider/dashboard/export-pdf */
  exportPdf: (params?: Record<string, string>) =>
    api.get("/provider/dashboard/export-pdf", { params, responseType: "blob" }),

  /** GET /provider/dashboard/export-excel */
  exportExcel: (params?: Record<string, string>) =>
    api.get("/provider/dashboard/export-excel", {
      params,
      responseType: "blob",
    }),
};
