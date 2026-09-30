import api from "@/lib/axios";
import type { AxiosRequestConfig } from "axios";
import {
  AdminCommissionSettings,
  AdminPaginationParams,
} from "../types/admin.types";
import {
  parseAdminDashboardChartResponse,
  parseAdminDashboardStatsResponse,
  parseAdminFeaturedListingsResponse,
  parseAdminFeaturedRateResponse,
  parseAdminListResponse,
  parseAdminObjectResponse,
  parseAdminPaginatedResponse,
} from "../schemas/admin-response.schemas";

type AdminRequestConfig = Pick<AxiosRequestConfig, "signal">;

async function readResponse(
  request: Promise<{ data: ApiPayload }>,
  parser: (payload: unknown) => unknown,
) : Promise<{ data: ApiPayload }> {
  const response = await request;
  return { ...response, data: parser(response.data) };
}

export const adminApi = {
  // Dashboard
  getDashboardStats: (params?: Record<string, unknown>) =>
    readResponse(
      api.get("/admin/dashboard/stats", { params }),
      parseAdminDashboardStatsResponse,
    ),
  getDashboardChartData: (params?: Record<string, unknown>) =>
    readResponse(
      api.get("/admin/dashboard/chart-data", { params }),
      parseAdminDashboardChartResponse,
    ),
  exportDashboardPdf: (params?: Record<string, unknown>) =>
    api.get("/admin/dashboard/export-pdf", { params, responseType: "blob" }),
  exportDashboardExcel: (params?: Record<string, unknown>) =>
    api.get("/admin/dashboard/export-excel", { params, responseType: "blob" }),

  // Users
  getUsers: (params?: AdminPaginationParams, config?: AdminRequestConfig) =>
    readResponse(
      api.get("/admin/users", { params, ...config }),
      (payload) => parseAdminPaginatedResponse(payload, "danh sách người dùng"),
    ),
  lockUser: (id: number, data?: { reason: string }) =>
    api.patch(`/admin/users/${id}/lock`, data),
  unlockUser: (id: number) => api.patch(`/admin/users/${id}/unlock`),
  deleteUser: (id: number) => api.delete(`/admin/users/${id}`),

  // Categories
  getCategories: () =>
    readResponse(api.get("/categories"), (payload) =>
      parseAdminListResponse(payload, "danh mục"),
    ),
  createCategory: (data: { name: string; description?: string; iconUrl?: string }) =>
    api.post("/categories", data),
  updateCategory: (id: number, data: { name?: string; description?: string; iconUrl?: string }) =>
    api.patch(`/categories/${id}`, data),
  deleteCategory: (id: number) => api.delete(`/categories/${id}`),

  // Staffs — UC07
  getPermissions: () =>
    readResponse(api.get("/admin/permissions"), (payload) =>
      parseAdminListResponse(payload, "quyền quản trị"),
    ),
  getStaffs: (params?: AdminPaginationParams, config?: AdminRequestConfig) =>
    readResponse(
      api.get("/admin/staffs", { params, ...config }),
      (payload) => parseAdminPaginatedResponse(payload, "danh sách nhân sự"),
    ),
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
    readResponse(api.get("/admin/kyc", { params }), (payload) =>
      parseAdminPaginatedResponse(payload, "danh sách KYC"),
    ),
  getKycDetail: (id: number) =>
    readResponse(api.get(`/admin/kyc/${id}`), (payload) =>
      parseAdminObjectResponse(payload, "chi tiết KYC"),
    ),
  approveKyc: (id: number) => api.patch(`/admin/kyc/${id}/approve`),
  rejectKyc: (id: number, reason: string) =>
    api.patch(`/admin/kyc/${id}/reject`, { reason }),

  // Services
  getServices: (params?: AdminPaginationParams) =>
    readResponse(api.get("/admin/services", { params }), (payload) =>
      parseAdminPaginatedResponse(payload, "danh sách dịch vụ"),
    ),
  approveService: (id: number) => api.patch(`/admin/services/${id}/approve`),
  rejectService: (id: number, reason: string) =>
    api.patch(`/admin/services/${id}/reject`, { reason }),
  hideService: (id: number, reason: string = "") =>
    api.patch(`/admin/services/${id}/hide`, { reason }),
  showService: (id: number) => api.patch(`/admin/services/${id}/show`),

  // Bookings
  getBookings: (params?: AdminPaginationParams, config?: AdminRequestConfig) =>
    readResponse(
      api.get("/admin/bookings", { params, ...config }),
      (payload) => parseAdminPaginatedResponse(payload, "danh sách booking"),
    ),
  getBookingDetail: (id: number) =>
    readResponse(api.get(`/admin/bookings/${id}`), (payload) =>
      parseAdminObjectResponse(payload, "chi tiết booking"),
    ),
  getBookingTimeline: (id: number) =>
    readResponse(api.get(`/admin/bookings/${id}/timeline`), (payload) =>
      parseAdminListResponse(payload, "timeline booking"),
    ),
  cancelBooking: (id: number, reason: string) =>
    api.patch(`/admin/bookings/${id}/cancel`, { reason }),

  // Wallet manual deposits / withdrawals
  getWalletDeposits: (params?: AdminPaginationParams) =>
    readResponse(api.get("/admin/wallet-deposits", { params }), (payload) =>
      parseAdminPaginatedResponse(payload, "danh sách nạp tiền"),
    ),
  approveWalletDeposit: (id: number, note?: string) =>
    api.patch(`/admin/wallet-deposits/${id}/approve`, { note }),
  rejectWalletDeposit: (id: number, note?: string) =>
    api.patch(`/admin/wallet-deposits/${id}/reject`, { note }),
  getWalletWithdrawals: (params?: AdminPaginationParams) =>
    readResponse(api.get("/admin/wallet-withdrawals", { params }), (payload) =>
      parseAdminPaginatedResponse(payload, "danh sách rút tiền"),
    ),
  approveWalletWithdrawal: (id: number, note?: string) =>
    api.patch(`/admin/wallet-withdrawals/${id}/approve`, { note }),
  rejectWalletWithdrawal: (id: number, note?: string) =>
    api.patch(`/admin/wallet-withdrawals/${id}/reject`, { note }),

  // Featured listings
  getFeaturedListings: (params?: AdminPaginationParams) =>
    readResponse(
      api.get('/admin/featured-listings', { params }),
      parseAdminFeaturedListingsResponse,
    ),
  cancelFeaturedListing: (id: number) =>
    api.patch(`/admin/featured-listings/${id}/cancel`),
  getFeaturedRate: () =>
    readResponse(
      api.get('/admin/settings/featured-rate'),
      parseAdminFeaturedRateResponse,
    ),
  updateFeaturedRate: (dailyRate: number) =>
    api.patch('/admin/settings/featured-rate', { dailyRate }),

  // Disputes — UC09
  getDisputes: (params?: AdminPaginationParams, config?: AdminRequestConfig) =>
    readResponse(
      api.get("/admin/disputes", { params, ...config }),
      (payload) => parseAdminPaginatedResponse(payload, "danh sách tranh chấp"),
    ),
  getDisputeDetail: (id: number) =>
    readResponse(api.get(`/admin/disputes/${id}`), (payload) =>
      parseAdminObjectResponse(payload, "chi tiết tranh chấp"),
    ),
  resolveDispute: (
    id: number,
    data: {
      resolutionAction: "COMPLETE" | "PENALIZE";
      resolutionReason: string;
      penaltyAmount?: number;
    },
  ) => api.patch(`/admin/disputes/${id}/resolve`, data),

  // Audit logs
  getAuditLogs: (params?: AdminPaginationParams, config?: AdminRequestConfig) =>
    readResponse(
      api.get("/admin/audit-logs", { params, ...config }),
      (payload) => parseAdminPaginatedResponse(payload, "audit logs"),
    ),
  exportAuditLogs: (params?: AdminPaginationParams) =>
    api.get("/admin/audit-logs/export", { params, responseType: "blob" }),

  // Settings — UC10.3
  getCommission: () =>
    readResponse(api.get("/admin/settings/commission"), (payload) =>
      parseAdminObjectResponse(payload, "cấu hình commission"),
    ),
  updateCommission: (data: AdminCommissionSettings) =>
    api.patch("/admin/settings/commission", data),
  getSocialSettings: () =>
    readResponse(api.get("/admin/settings/social"), (payload) =>
      parseAdminObjectResponse(payload, "cấu hình mạng xã hội"),
    ),
  updateSocialSettings: (data: Record<string, unknown>) =>
    api.patch("/admin/settings/social", data),
};
