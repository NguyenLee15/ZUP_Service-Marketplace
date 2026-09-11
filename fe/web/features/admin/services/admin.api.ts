import api from "@/lib/axios";
import {
  AdminCommissionSettings,
  AdminPaginationParams,
} from "../types/admin.types";

export const adminApi = {
  // Dashboard
  getDashboardStats: (params?: Record<string, unknown>) =>
    api.get("/admin/dashboard/stats", { params }),
  getDashboardChartData: (params?: Record<string, unknown>) =>
    api.get("/admin/dashboard/chart-data", { params }),
  exportDashboardPdf: (params?: Record<string, unknown>) =>
    api.get("/admin/dashboard/export-pdf", { params, responseType: "blob" }),
  exportDashboardExcel: (params?: Record<string, unknown>) =>
    api.get("/admin/dashboard/export-excel", { params, responseType: "blob" }),

  // Users
  getUsers: (params?: AdminPaginationParams) =>
    api.get("/admin/users", { params }),
  lockUser: (id: number, data?: { reason: string }) =>
    api.patch(`/admin/users/${id}/lock`, data),
  unlockUser: (id: number) => api.patch(`/admin/users/${id}/unlock`),
  deleteUser: (id: number) => api.delete(`/admin/users/${id}`),

  // Categories
  getCategories: () => api.get("/categories"),
  createCategory: (data: { name: string; description?: string; iconUrl?: string }) =>
    api.post("/categories", data),
  updateCategory: (id: number, data: { name?: string; description?: string; iconUrl?: string }) =>
    api.patch(`/categories/${id}`, data),
  deleteCategory: (id: number) => api.delete(`/categories/${id}`),

  // Staffs — UC07
  getPermissions: () => api.get("/admin/permissions"),
  getStaffs: (params?: AdminPaginationParams) =>
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
  getKycRequests: (params?: AdminPaginationParams) =>
    api.get("/admin/kyc", { params }),
  getKycDetail: (id: number) => api.get(`/admin/kyc/${id}`),
  approveKyc: (id: number) => api.patch(`/admin/kyc/${id}/approve`),
  rejectKyc: (id: number, reason: string) =>
    api.patch(`/admin/kyc/${id}/reject`, { reason }),

  // Services
  getServices: (params?: AdminPaginationParams) =>
    api.get("/admin/services", { params }),
  approveService: (id: number) => api.patch(`/admin/services/${id}/approve`),
  rejectService: (id: number, reason: string) =>
    api.patch(`/admin/services/${id}/reject`, { reason }),
  hideService: (id: number, reason: string = "") =>
    api.patch(`/admin/services/${id}/hide`, { reason }),
  showService: (id: number) => api.patch(`/admin/services/${id}/show`),
  deleteService: (id: number) => api.delete(`/admin/services/${id}`),

  // Bookings
  getBookings: (params?: AdminPaginationParams) =>
    api.get("/admin/bookings", { params }),
  getBookingDetail: (id: number) => api.get(`/admin/bookings/${id}`),
  getBookingTimeline: (id: number) => api.get(`/admin/bookings/${id}/timeline`),
  cancelBooking: (id: number, reason: string) =>
    api.patch(`/admin/bookings/${id}/cancel`, { reason }),

  // Wallet manual deposits / withdrawals
  getWalletDeposits: (params?: AdminPaginationParams) =>
    api.get("/admin/wallet-deposits", { params }),
  approveWalletDeposit: (id: number, note?: string) =>
    api.patch(`/admin/wallet-deposits/${id}/approve`, { note }),
  rejectWalletDeposit: (id: number, note?: string) =>
    api.patch(`/admin/wallet-deposits/${id}/reject`, { note }),
  getWalletWithdrawals: (params?: AdminPaginationParams) =>
    api.get("/admin/wallet-withdrawals", { params }),
  approveWalletWithdrawal: (id: number, note?: string) =>
    api.patch(`/admin/wallet-withdrawals/${id}/approve`, { note }),
  rejectWalletWithdrawal: (id: number, note?: string) =>
    api.patch(`/admin/wallet-withdrawals/${id}/reject`, { note }),

  // Disputes — UC09
  getDisputes: (params?: AdminPaginationParams) =>
    api.get("/admin/disputes", { params }),
  getDisputeDetail: (id: number) => api.get(`/admin/disputes/${id}`),
  resolveDispute: (
    id: number,
    data: {
      resolutionAction: "COMPLETE" | "PENALIZE";
      resolutionReason: string;
      penaltyAmount?: number;
    },
  ) => api.patch(`/admin/disputes/${id}/resolve`, data),

  // Audit logs
  getAuditLogs: (params?: AdminPaginationParams) =>
    api.get("/admin/audit-logs", { params }),
  exportAuditLogs: (params?: AdminPaginationParams) =>
    api.get("/admin/audit-logs/export", { params, responseType: "blob" }),

  // Settings — UC10.3
  getCommission: () => api.get("/admin/settings/commission"),
  updateCommission: (data: AdminCommissionSettings) =>
    api.patch("/admin/settings/commission", data),
  getSocialSettings: () => api.get("/admin/settings/social"),
  updateSocialSettings: (data: Record<string, unknown>) =>
    api.patch("/admin/settings/social", data),
};
