import api from "@/lib/axios";

export const servicesApi = {
  search: (params: Record<string, ApiPayload>) =>
    api.get("/services/search", { params }),

  aiSearch: (query: string, lat?: number, lng?: number) => api.post("/services/ai-search", { query, lat, lng }),

  getDetail: (id: number) => api.get(`/services/${id}`),

  getReviews: (serviceId: number, params?: Record<string, ApiPayload>) =>
    api.get(`/reviews/service/${serviceId}`, { params }),

  // Provider
  getMyServices: (status?: string) =>
    api.get("/services/my/list", { params: status ? { status } : {} }),

  create: (formData: FormData) =>
    api.post("/services", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  update: (id: number, formData: FormData) =>
    api.patch(`/services/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  submit: (id: number) => api.patch(`/services/${id}/submit`),

  hide: (id: number) => api.patch(`/services/${id}/hide`),

  show: (id: number) => api.patch(`/services/${id}/show`),

  delete: (id: number) => api.delete(`/services/${id}`),

  purchaseFeature: (serviceId: number, days: number) =>
    api.post(`/services/${serviceId}/feature`, { days }),

  getFeatured: () => api.get("/services/featured"),
};

export const categoriesApi = {
  getTree: () => api.get("/categories/tree"),
  getFlat: () => api.get("/categories/flat"),
};

export const bookingsApi = {
  create: (data: ApiPayload) => api.post("/bookings", data),

  extractIntent: (prompt: string, latitude?: number, longitude?: number) =>
    api.post("/bookings/intent-extract", { prompt, latitude, longitude }),


  getMyBookings: (params?: Record<string, ApiPayload>) =>
    api.get("/bookings", { params }),

  getById: (id: number) => api.get(`/bookings/${id}`),

  getTimeline: (id: number) => api.get(`/bookings/${id}/timeline`),

  confirmQuote: (id: number) => api.patch(`/bookings/${id}/confirm-quote`),

  rejectQuote: (id: number, reason: string) =>
    api.patch(`/bookings/${id}/reject-quote`, { reason }),

  confirmSupplementaryQuote: (id: number, suppQuoteId: number) =>
    api.patch(`/bookings/${id}/confirm-supplementary-quote`, { suppQuoteId }),

  rejectSupplementaryQuote: (id: number, suppQuoteId: number, reason: string) =>
    api.patch(`/bookings/${id}/reject-supplementary-quote`, { suppQuoteId, reason }),

  accept: (id: number) => api.patch(`/bookings/${id}/accept`),

  dispute: (id: number, formData: FormData) =>
    api.post(`/bookings/${id}/dispute`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  cancel: (id: number, reason: string) =>
    api.patch(`/bookings/${id}/cancel`, { reason }),

  rebook: (id: number) => api.post(`/bookings/${id}/rebook`),

  // Provider
  providerBookings: (params?: Record<string, ApiPayload>) =>
    api.get("/provider/bookings", { params }),

  providerGetById: (id: number) => api.get(`/provider/bookings/${id}`),

  confirmSurveyor: (id: number, data: ApiPayload) =>
    api.patch(`/provider/bookings/${id}/surveyor`, data),

  sendQuote: (id: number, formData: FormData) =>
    api.post(`/provider/bookings/${id}/quote`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  startWork: (id: number) => api.patch(`/provider/bookings/${id}/start`),

  completeWork: (id: number, formData: FormData) =>
    api.patch(`/provider/bookings/${id}/complete`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  providerCancel: (id: number, reason: string) =>
    api.patch(`/provider/bookings/${id}/cancel`, { reason }),
};

export const walletsApi = {
  getBalance: () => api.get("/provider-wallets/balance"),
  getHistory: (params?: Record<string, ApiPayload>) =>
    api.get("/provider-wallets/history", { params }),
  deposit: (amount: number) =>
    api.post("/provider-wallets/deposit", { amount }),
};

export const notificationsApi = {
  getAll: (params?: Record<string, ApiPayload>) =>
    api.get("/notifications", { params }),
  getUnreadCount: () => api.get("/notifications/unread-count"),
  markRead: (id: number) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch("/notifications/read-all"),
  delete: (id: number) => api.delete(`/notifications/${id}`),
};

export const chatbotApi = {
  updateSessionTitle: (id: string, title: string) =>
    api.patch(`/chatbot/sessions/${id}/title`, { title }),
};

export const chatsApi = {
  getConversations: () => api.get("/chats"),
  getMessages: (conversationId: number, cursor?: number) =>
    api.get(`/chats/${conversationId}/messages`, {
      params: cursor ? { cursor } : {},
    }),
  getOrCreateConversation: (data: { bookingId?: number; serviceId?: number }) =>
    api.post("/chats/conversations", data),
};

export const reviewsApi = {
  create: (data: { bookingId: number; rating: number; comment?: string }) =>
    api.post("/reviews", data),
};

// ===== ADMIN APIs (Delegated to features/admin/services/admin.api) =====
export { adminApi } from "@/features/admin/services/admin.api";

export const providerDashboardApi = {
  getStats: (params?: Record<string, ApiPayload>) =>
    api.get("/provider/dashboard/stats", { params }),
  exportPdf: (params?: Record<string, ApiPayload>) =>
    api.get("/provider/dashboard/export-pdf", { params, responseType: "blob" }),
  exportExcel: (params?: Record<string, ApiPayload>) =>
    api.get("/provider/dashboard/export-excel", {
      params,
      responseType: "blob",
    }),
};

export const publicSettingsApi = {
  getSocial: () => api.get("/settings/public-social"),
};
