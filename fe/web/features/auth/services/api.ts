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

// ===== ADMIN APIs =====

export const adminApi = {
  // Dashboard
  getDashboardStats: (params?: Record<string, ApiPayload>) =>
    api.get("/admin/dashboard/stats", { params }),
  getDashboardChartData: (params?: Record<string, ApiPayload>) =>
    api.get("/admin/dashboard/chart-data", { params }),
  exportDashboardPdf: (params?: Record<string, ApiPayload>) =>
    api.get("/admin/dashboard/export-pdf", { params, responseType: "blob" }),
  exportDashboardExcel: (params?: Record<string, ApiPayload>) =>
    api.get("/admin/dashboard/export-excel", { params, responseType: "blob" }),

  // Users
  getUsers: (params?: Record<string, ApiPayload>) =>
    api.get("/admin/users", { params }),
  lockUser: (id: number, data?: { reason: string }) =>
    api.patch(`/admin/users/${id}/lock`, data),
  unlockUser: (id: number) => api.patch(`/admin/users/${id}/unlock`),
  deleteUser: (id: number) => api.delete(`/admin/users/${id}`),

  // Categories
  createCategory: (data: ApiPayload) => api.post("/categories", data),
  updateCategory: (id: number, data: ApiPayload) =>
    api.patch(`/categories/${id}`, data),
  deleteCategory: (id: number) => api.delete(`/categories/${id}`),

  // Staffs — UC07
  getPermissions: () => api.get("/admin/permissions"),
  getStaffs: (params?: Record<string, ApiPayload>) =>
    api.get("/admin/staffs", { params }),
  createStaff: (data: {
    fullName: string;
    email: string;
    phone?: string;
    password: string;
  }) => api.post("/admin/staffs", data),
  updateStaff: (
    id: number,
    data: {
      fullName?: string;
      phone?: string;
      status?: string;
      permissions?: string[];
    },
  ) => api.patch(`/admin/staffs/${id}`, data),
  deleteStaff: (id: number) => api.delete(`/admin/staffs/${id}`),

  // KYC
  getKycRequests: (params?: Record<string, ApiPayload>) =>
    api.get("/admin/kyc", { params }),
  getKycDetail: (id: number) => api.get(`/admin/kyc/${id}`),
  approveKyc: (id: number) => api.patch(`/admin/kyc/${id}/approve`),
  rejectKyc: (id: number, reason: string) =>
    api.patch(`/admin/kyc/${id}/reject`, { reason }),

  // Services
  getServices: (params?: Record<string, ApiPayload>) =>
    api.get("/admin/services", { params }),
  approveService: (id: number) => api.patch(`/admin/services/${id}/approve`),
  rejectService: (id: number, reason: string) =>
    api.patch(`/admin/services/${id}/reject`, { reason }),
  hideService: (id: number, reason: string = "") =>
    api.patch(`/admin/services/${id}/hide`, { reason }),
  showService: (id: number) => api.patch(`/admin/services/${id}/show`),
  deleteService: (id: number) => api.delete(`/admin/services/${id}`),

  // Bookings
  getBookings: (params?: Record<string, ApiPayload>) =>
    api.get("/admin/bookings", { params }),
  getBookingDetail: (id: number) => api.get(`/admin/bookings/${id}`),
  getBookingTimeline: (id: number) => api.get(`/admin/bookings/${id}/timeline`),
  cancelBooking: (id: number, reason: string) =>
    api.patch(`/admin/bookings/${id}/cancel`, { reason }),

  // Wallet manual deposits / withdrawals
  getWalletDeposits: (params?: Record<string, ApiPayload>) =>
    api.get("/admin/wallet-deposits", { params }),
  approveWalletDeposit: (id: number, note?: string) =>
    api.patch(`/admin/wallet-deposits/${id}/approve`, { note }),
  rejectWalletDeposit: (id: number, note?: string) =>
    api.patch(`/admin/wallet-deposits/${id}/reject`, { note }),
  getWalletWithdrawals: (params?: Record<string, ApiPayload>) =>
    api.get("/admin/wallet-withdrawals", { params }),
  approveWalletWithdrawal: (id: number, note?: string) =>
    api.patch(`/admin/wallet-withdrawals/${id}/approve`, { note }),
  rejectWalletWithdrawal: (id: number, note?: string) =>
    api.patch(`/admin/wallet-withdrawals/${id}/reject`, { note }),

  // Disputes — UC09
  getDisputes: (params?: Record<string, ApiPayload>) =>
    api.get("/admin/disputes", { params }),
  getDisputeDetail: (id: number) => api.get(`/admin/disputes/${id}`),
  resolveDispute: (
    id: number,
    data: {
      resolutionAction: 'COMPLETE' | 'PENALIZE';
      resolutionReason: string;
      penaltyAmount?: number;
    },
  ) => api.patch(`/admin/disputes/${id}/resolve`, data),

  // Audit logs
  getAuditLogs: (params?: Record<string, ApiPayload>) =>
    api.get("/admin/audit-logs", { params }),
  exportAuditLogs: (params?: Record<string, ApiPayload>) =>
    api.get("/admin/audit-logs/export", { params, responseType: "blob" }),

  // Settings — UC10.3
  getCommission: () => api.get("/admin/settings/commission"),
  updateCommission: (data: {
    rate: number;
    minAmount: number;
    maxAmount: number;
  }) => api.patch("/admin/settings/commission", data),
  getSocialSettings: () => api.get("/admin/settings/social"),
  updateSocialSettings: (data: ApiPayload) =>
    api.patch("/admin/settings/social", data),
};

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
