import api from "@/lib/axios";

export const servicesApi = {
  search: (params: Record<string, any>) =>
    api.get("/services/search", { params }),

  aiSearch: (query: string) => api.post("/services/ai-search", { query }),

  getDetail: (id: number) => api.get(`/services/${id}`),

  getReviews: (serviceId: number, params?: Record<string, any>) =>
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
  create: (data: any) => api.post("/bookings", data),

  getMyBookings: (params?: Record<string, any>) =>
    api.get("/bookings", { params }),

  getById: (id: number) => api.get(`/bookings/${id}`),

  confirmQuote: (id: number) => api.patch(`/bookings/${id}/confirm-quote`),

  rejectQuote: (id: number, reason: string) =>
    api.patch(`/bookings/${id}/reject-quote`, { reason }),

  accept: (id: number) => api.patch(`/bookings/${id}/accept`),

  dispute: (id: number, formData: FormData) =>
    api.post(`/bookings/${id}/dispute`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  cancel: (id: number, reason: string) =>
    api.patch(`/bookings/${id}/cancel`, { reason }),

  rebook: (id: number) => api.post(`/bookings/${id}/rebook`),

  // Provider
  providerBookings: (params?: Record<string, any>) =>
    api.get("/provider/bookings", { params }),

  providerGetById: (id: number) => api.get(`/provider/bookings/${id}`),

  confirmSurveyor: (id: number, data: any) =>
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
  getHistory: (params?: Record<string, any>) =>
    api.get("/provider-wallets/history", { params }),
  deposit: (amount: number) =>
    api.post("/provider-wallets/deposit", { amount }),
};

export const notificationsApi = {
  getAll: (params?: Record<string, any>) =>
    api.get("/notifications", { params }),
  getUnreadCount: () => api.get("/notifications/unread-count"),
  markRead: (id: number) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch("/notifications/read-all"),
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
  getDashboardStats: (params?: Record<string, any>) =>
    api.get("/admin/dashboard/stats", { params }),
  getDashboardChartData: (params?: Record<string, any>) =>
    api.get("/admin/dashboard/chart-data", { params }),
  exportDashboardPdf: (params?: Record<string, any>) =>
    api.get("/admin/dashboard/export-pdf", { params, responseType: "blob" }),
  exportDashboardExcel: (params?: Record<string, any>) =>
    api.get("/admin/dashboard/export-excel", { params, responseType: "blob" }),

  // Users
  getUsers: (params?: Record<string, any>) =>
    api.get("/admin/users", { params }),
  lockUser: (id: number) => api.patch(`/admin/users/${id}/lock`),
  unlockUser: (id: number) => api.patch(`/admin/users/${id}/unlock`),
  deleteUser: (id: number) => api.delete(`/admin/users/${id}`),

  // Categories
  createCategory: (data: any) => api.post("/admin/categories", data),
  updateCategory: (id: number, data: any) =>
    api.patch(`/admin/categories/${id}`, data),
  deleteCategory: (id: number) => api.delete(`/admin/categories/${id}`),

  // Staffs — UC07
  getStaffs: (params?: Record<string, any>) =>
    api.get("/admin/staffs", { params }),
  createStaff: (data: {
    fullName: string;
    email: string;
    phone?: string;
    password: string;
  }) => api.post("/admin/staffs", data),
  updateStaff: (
    id: number,
    data: { fullName?: string; phone?: string; status?: string },
  ) => api.patch(`/admin/staffs/${id}`, data),
  deleteStaff: (id: number) => api.delete(`/admin/staffs/${id}`),

  // KYC
  getKycRequests: (params?: Record<string, any>) =>
    api.get("/admin/kyc", { params }),
  getKycDetail: (id: number) => api.get(`/admin/kyc/${id}`),
  approveKyc: (id: number) => api.patch(`/admin/kyc/${id}/approve`),
  rejectKyc: (id: number, reason: string) =>
    api.patch(`/admin/kyc/${id}/reject`, { reason }),

  // Services
  getServices: (params?: Record<string, any>) =>
    api.get("/admin/services", { params }),
  approveService: (id: number) => api.patch(`/admin/services/${id}/approve`),
  rejectService: (id: number, reason: string) =>
    api.patch(`/admin/services/${id}/reject`, { reason }),
  hideService: (id: number, reason: string = "") =>
    api.patch(`/admin/services/${id}/hide`, { reason }),
  deleteService: (id: number) => api.delete(`/admin/services/${id}`),

  // Bookings
  getBookings: (params?: Record<string, any>) =>
    api.get("/admin/bookings", { params }),
  getBookingDetail: (id: number) => api.get(`/admin/bookings/${id}`),

  // Disputes — UC09
  getDisputes: (params?: Record<string, any>) =>
    api.get("/admin/disputes", { params }),
  getDisputeDetail: (id: number) => api.get(`/admin/disputes/${id}`),
  resolveDispute: (
    id: number,
    data: { resolutionAction: string; resolutionReason: string },
  ) => api.patch(`/admin/disputes/${id}/resolve`, data),

  // Settings — UC10.3
  getCommission: () => api.get("/admin/settings/commission"),
  updateCommission: (data: {
    rate: number;
    minAmount: number;
    maxAmount: number;
  }) => api.patch("/admin/settings/commission", data),
  getSocialSettings: () => api.get("/admin/settings/social"),
  updateSocialSettings: (data: any) =>
    api.patch("/admin/settings/social", data),
};

export const providerDashboardApi = {
  getStats: (params?: Record<string, any>) =>
    api.get("/provider/dashboard/stats", { params }),
  exportPdf: (params?: Record<string, any>) =>
    api.get("/provider/dashboard/export-pdf", { params, responseType: "blob" }),
  exportExcel: (params?: Record<string, any>) =>
    api.get("/provider/dashboard/export-excel", {
      params,
      responseType: "blob",
    }),
};

export const publicSettingsApi = {
  getSocial: () => api.get("/settings/public-social"),
};
