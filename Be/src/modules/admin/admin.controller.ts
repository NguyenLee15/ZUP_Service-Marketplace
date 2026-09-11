/**
 * @deprecated
 * The monolithic AdminController (405 lines) has been successfully decomposed
 * into 8 dedicated domain controllers in `./controllers/`:
 * - AdminUsersController (`admin/users`)
 * - AdminStaffsController (`admin/staffs`, `admin/permissions`)
 * - AdminKycController (`admin/kyc`)
 * - AdminBookingsController (`admin/bookings`)
 * - AdminDisputesController (`admin/disputes`)
 * - AdminFinanceController (`admin/settings/commission`, `admin/settings/social`)
 * - AdminAuditLogsController (`admin/audit-logs`)
 * - AdminDashboardController (`admin/dashboard`)
 *
 * This file is kept for backward compatibility and clean architecture documentation.
 */
export * from './controllers';
