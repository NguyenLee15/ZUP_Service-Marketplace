import { Module } from '@nestjs/common';
import {
  AdminUsersController,
  AdminStaffsController,
  AdminKycController,
  AdminBookingsController,
  AdminDisputesController,
  AdminFinanceController,
  AdminAuditLogsController,
  AdminDashboardController,
} from './controllers';
import { BookingsModule } from '../bookings/bookings.module';
import { UsersModule } from '../users/users.module';
import { AdminService } from './services/admin.service';
import { AdminDashboardService } from './services/admin-dashboard.service';
import { StaffAdminService } from './services/staff-admin.service';
import { SettingsModule } from '../settings/settings.module';
import { AdminAuditLogService } from './services/admin-audit-log.service';

@Module({
  imports: [BookingsModule, UsersModule, SettingsModule],
  controllers: [
    AdminUsersController,
    AdminStaffsController,
    AdminKycController,
    AdminBookingsController,
    AdminDisputesController,
    AdminFinanceController,
    AdminAuditLogsController,
    AdminDashboardController,
  ],
  providers: [
    AdminService,
    AdminDashboardService,
    StaffAdminService,
    AdminAuditLogService,
  ],
})
export class AdminModule {}
