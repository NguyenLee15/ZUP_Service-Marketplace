import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { BookingsModule } from '../bookings/bookings.module';
import { UsersModule } from '../users/users.module';
import { AdminService } from './services/admin.service';
import { AdminDashboardService } from './services/admin-dashboard.service';
import { StaffAdminService } from './services/staff-admin.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [BookingsModule, UsersModule, SettingsModule],
  controllers: [AdminController],
  providers: [AdminService, AdminDashboardService, StaffAdminService],
})
export class AdminModule {}
