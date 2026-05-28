import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Body,
  Res,
  Ip,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminResolveDisputeDto } from './dto/admin.dto';
import { AdminService } from './services/admin.service';
import { AdminDashboardService } from './services/admin-dashboard.service';
import { StaffAdminService } from './services/staff-admin.service';
import {
  PublicSocialConfig,
  SettingsService,
} from '../settings/settings.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'STAFF')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly dashboardService: AdminDashboardService,
    private readonly staffService: StaffAdminService,
    private readonly settingsService: SettingsService,
  ) {}

  // ===== USERS =====

  @Get('users')
  async getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.adminService.getUsers(
      parseInt(page || '1'),
      parseInt(limit || '20'),
      role,
      status,
      keyword,
    );
  }

  @Patch('users/:id/lock')
  async lockUser(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { reason: string },
    @Ip() ip: string,
  ) {
    await this.adminService.lockUser(adminId, id, body.reason, ip);
    return { message: 'Đã khóa tài khoản và thu hồi toàn bộ phiên đăng nhập' };
  }

  @Patch('users/:id/unlock')
  async unlockUser(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Ip() ip: string,
  ) {
    await this.adminService.unlockUser(adminId, id, ip);
    return { message: 'Đã mở khóa tài khoản' };
  }

  @Delete('users/:id')
  @Roles('ADMIN')
  async deleteUser(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Ip() ip: string,
  ) {
    return this.adminService.deleteUser(adminId, id, ip);
  }

  // ===== STAFFS =====

  @Get('staffs')
  async getStaffs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.staffService.getStaffs(
      parseInt(page || '1'),
      parseInt(limit || '20'),
      keyword,
    );
  }

  @Post('staffs')
  @Roles('ADMIN')
  async createStaff(
    @CurrentUser('id') adminId: number,
    @Ip() ip: string,
    @Body()
    body: {
      fullName: string;
      email: string;
      phone?: string;
      password: string;
      permissions?: string[];
    },
  ) {
    const user = await this.staffService.createStaff(adminId, ip, body);
    return {
      data: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
      message: 'Tạo tài khoản nhân viên thành công',
    };
  }

  @Patch('staffs/:id')
  @Roles('ADMIN')
  async updateStaff(
    @CurrentUser('id') adminId: number,
    @Ip() ip: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { fullName?: string; phone?: string; status?: string; permissions?: string[] },
  ) {
    await this.staffService.updateStaff(adminId, ip, id, body);
    return { message: 'Đã cập nhật nhân viên' };
  }

  @Delete('staffs/:id')
  @Roles('ADMIN')
  async deleteStaff(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Ip() ip: string,
  ) {
    await this.staffService.deleteStaff(adminId, id, ip);
    return { message: 'Đã xóa tài khoản nhân viên (Soft delete)' };
  }

  // ===== KYC =====

  @Get('kyc')
  @Permissions('kyc_view')
  async getKycRequests(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getKycRequests(
      status,
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
  }

  @Get('kyc/:id')
  @Permissions('kyc_view')
  async getKycRequestById(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getKycRequestById(id);
  }

  @Patch('kyc/:id/approve')
  @Permissions('kyc_approve')
  async approveKyc(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Ip() ip: string,
  ) {
    return this.adminService.reviewKyc(adminId, id, 'APPROVE', undefined, ip);
  }

  @Patch('kyc/:id/reject')
  @Permissions('kyc_reject')
  async rejectKyc(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { reason: string },
    @Ip() ip: string,
  ) {
    return this.adminService.reviewKyc(adminId, id, 'REJECT', body.reason, ip);
  }

  // ===== BOOKINGS =====

  @Get('bookings')
  async getBookings(
    @Query('status') status?: string,
    @Query('keyword') keyword?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getBookings(
      status,
      keyword,
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
  }

  @Get('bookings/:id')
  async getBookingDetail(@Param('id', ParseIntPipe) id: number) {
    const data = await this.adminService.getBookingDetail(id);
    return { data };
  }

  @Patch('bookings/:id/cancel')
  async cancelBooking(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { reason: string },
  ) {
    return this.adminService.cancelBooking(adminId, id, body.reason);
  }

  // ===== DISPUTES =====

  @Get('disputes')
  @Permissions('dispute_view')
  async getDisputes(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getDisputes(
      status,
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
  }

  @Get('disputes/:id')
  @Permissions('dispute_view')
  async getDisputeDetail(@Param('id', ParseIntPipe) id: number) {
    const data = await this.adminService.getDisputeDetail(id);
    return { data };
  }

  @Patch('disputes/:id/resolve')
  @Permissions('dispute_resolve')
  async resolveDispute(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminResolveDisputeDto,
    @Ip() ip: string,
  ) {
    return this.adminService.resolveDispute(adminId, id, dto, ip);
  }

  // ===== SETTINGS =====

  @Get('settings/commission')
  @Permissions('finance_commission')
  async getCommission() {
    const data = await this.adminService.getCommissionSettings();
    return { data };
  }

  @Patch('settings/commission')
  @Permissions('finance_commission')
  async updateCommission(
    @CurrentUser('id') adminId: number,
    @Body() body: { rate: number; minAmount: number; maxAmount: number },
  ) {
    await this.adminService.updateCommissionSettings(adminId, body);
    return { message: 'Đã cập nhật cấu hình hoa hồng' };
  }

  @Get('settings/social')
  @Permissions('finance_commission')
  async getSocialSettings() {
    const data = await this.settingsService.getPublicSocialConfig();
    return { data };
  }

  @Patch('settings/social')
  @Permissions('finance_commission')
  async updateSocialSettings(@Body() body: Partial<PublicSocialConfig>) {
    const data = await this.settingsService.updatePublicSocialConfig(body);
    return { data, message: 'Đã cập nhật cấu hình mạng xã hội' };
  }

  // ===== DASHBOARD =====

  @Get('dashboard/stats')
  @Permissions('finance_revenue')
  async getDashboardStats(@Query() filters: Record<string, string>) {
    const data = await this.dashboardService.getDashboardStats(filters);
    return { data };
  }

  @Get('dashboard/chart-data')
  @Permissions('finance_revenue')
  async getDashboardChartData(@Query() filters: Record<string, string>) {
    const data = await this.dashboardService.getDashboardChartData(filters);
    return { data };
  }

  @Get('dashboard/export-pdf')
  @Permissions('finance_revenue')
  async exportDashboardPdf(
    @Query() filters: Record<string, string>,
    @Res() res: Response,
  ) {
    return this.dashboardService.exportDashboardPdf(res, filters);
  }

  @Get('dashboard/export-excel')
  @Permissions('finance_revenue')
  @HttpCode(HttpStatus.OK)
  async exportDashboardExcel(
    @Query() filters: Record<string, string>,
    @Res() res: Response,
  ) {
    return this.dashboardService.exportDashboardExcel(res, filters);
  }
}
