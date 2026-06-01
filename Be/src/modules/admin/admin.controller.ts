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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../common/decorators/api-contract.decorator';
import {
  AdminPermission,
  ADMIN_PERMISSION_GROUPS,
} from '../../common/constants/admin-permissions';
import {
  AdminAuditLogsQueryDto,
  AdminBookingsQueryDto,
  AdminDashboardQueryDto,
  AdminReasonDto,
  AdminResolveDisputeDto,
  AdminStaffsQueryDto,
  AdminStatusListQueryDto,
  AdminUsersQueryDto,
  CreateStaffDto,
  UpdateCommissionSettingsDto,
  UpdateStaffDto,
} from './dto/admin.dto';
import { AdminService } from './services/admin.service';
import { AdminDashboardService } from './services/admin-dashboard.service';
import { StaffAdminService } from './services/staff-admin.service';
import { AdminAuditLogService } from './services/admin-audit-log.service';
import {
  PublicSocialConfig,
  SettingsService,
} from '../settings/settings.service';
import { BookingQueryService } from '../bookings/booking-query.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'STAFF')
@ApiTags('admin')
@ApiBearerAuth()
@ApiErrorResponses()
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly dashboardService: AdminDashboardService,
    private readonly staffService: StaffAdminService,
    private readonly settingsService: SettingsService,
    private readonly auditLogService: AdminAuditLogService,
    private readonly bookingQueryService: BookingQueryService,
  ) {}

  // ===== USERS =====

  @Get('users')
  @Permissions(AdminPermission.USER_VIEW)
  @ApiOperation({ summary: 'List users for admin/staff' })
  @ApiSuccessResponse('Admin user list')
  async getUsers(@Query() query: AdminUsersQueryDto) {
    return this.adminService.getUsers(
      query.page,
      query.limit,
      query.role,
      query.status,
      query.keyword,
    );
  }

  @Patch('users/:id/lock')
  @Permissions(AdminPermission.USER_LOCK)
  async lockUser(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AdminReasonDto,
    @Ip() ip: string,
  ) {
    await this.adminService.lockUser(adminId, id, body.reason, ip);
    return { message: 'Đã khóa tài khoản và thu hồi toàn bộ phiên đăng nhập' };
  }

  @Patch('users/:id/unlock')
  @Permissions(AdminPermission.USER_LOCK)
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

  @Get('permissions')
  @Permissions(AdminPermission.STAFF_VIEW)
  @ApiOperation({ summary: 'List available staff permissions grouped for UI' })
  @ApiSuccessResponse('Admin permission groups')
  getPermissions() {
    return { data: ADMIN_PERMISSION_GROUPS };
  }

  @Get('staffs')
  @Permissions(AdminPermission.STAFF_VIEW)
  @ApiOperation({ summary: 'List admin and staff accounts' })
  async getStaffs(@Query() query: AdminStaffsQueryDto) {
    return this.staffService.getStaffs(query.page, query.limit, query.keyword);
  }

  @Post('staffs')
  @Roles('ADMIN')
  @Permissions(AdminPermission.STAFF_MANAGE)
  @ApiOperation({ summary: 'Create staff account with permissions' })
  async createStaff(
    @CurrentUser('id') adminId: number,
    @Ip() ip: string,
    @Body() body: CreateStaffDto,
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
  @Permissions(AdminPermission.STAFF_MANAGE)
  @ApiOperation({ summary: 'Update staff account and permissions' })
  async updateStaff(
    @CurrentUser('id') adminId: number,
    @Ip() ip: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateStaffDto,
  ) {
    await this.staffService.updateStaff(adminId, ip, id, body);
    return { message: 'Đã cập nhật nhân viên' };
  }

  @Delete('staffs/:id')
  @Roles('ADMIN')
  @Permissions(AdminPermission.STAFF_MANAGE)
  @ApiOperation({ summary: 'Soft delete staff account' })
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
  @Permissions(AdminPermission.KYC_VIEW)
  async getKycRequests(@Query() query: AdminStatusListQueryDto) {
    return this.adminService.getKycRequests(
      query.status,
      query.page,
      query.limit,
    );
  }

  @Get('kyc/:id')
  @Permissions(AdminPermission.KYC_VIEW)
  async getKycRequestById(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getKycRequestById(id);
  }

  @Patch('kyc/:id/approve')
  @Permissions(AdminPermission.KYC_APPROVE)
  async approveKyc(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Ip() ip: string,
  ) {
    return this.adminService.reviewKyc(adminId, id, 'APPROVE', undefined, ip);
  }

  @Patch('kyc/:id/reject')
  @Permissions(AdminPermission.KYC_REJECT)
  async rejectKyc(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AdminReasonDto,
    @Ip() ip: string,
  ) {
    return this.adminService.reviewKyc(adminId, id, 'REJECT', body.reason, ip);
  }

  // ===== BOOKINGS =====

  @Get('bookings')
  @Permissions(AdminPermission.BOOKING_VIEW)
  async getBookings(@Query() query: AdminBookingsQueryDto) {
    return this.adminService.getBookings(
      query.status,
      query.keyword,
      query.page,
      query.limit,
    );
  }

  @Get('bookings/:id/timeline')
  @Permissions(AdminPermission.BOOKING_VIEW)
  @ApiOperation({ summary: 'Get booking status timeline for admin/staff' })
  async getBookingTimeline(@Param('id', ParseIntPipe) id: number) {
    return this.bookingQueryService.getTimelineForAdmin(id);
  }

  @Get('bookings/:id')
  @Permissions(AdminPermission.BOOKING_VIEW)
  async getBookingDetail(@Param('id', ParseIntPipe) id: number) {
    const data = await this.adminService.getBookingDetail(id);
    return { data };
  }

  @Patch('bookings/:id/cancel')
  @Permissions(AdminPermission.BOOKING_CANCEL)
  async cancelBooking(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AdminReasonDto,
  ) {
    return this.adminService.cancelBooking(adminId, id, body.reason);
  }

  // ===== DISPUTES =====

  @Get('disputes')
  @Permissions(AdminPermission.DISPUTE_VIEW)
  async getDisputes(@Query() query: AdminStatusListQueryDto) {
    return this.adminService.getDisputes(query.status, query.page, query.limit);
  }

  @Get('disputes/:id')
  @Permissions(AdminPermission.DISPUTE_VIEW)
  async getDisputeDetail(@Param('id', ParseIntPipe) id: number) {
    const data = await this.adminService.getDisputeDetail(id);
    return { data };
  }

  @Patch('disputes/:id/resolve')
  @Permissions(AdminPermission.DISPUTE_RESOLVE)
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
  @Permissions(AdminPermission.FINANCE_COMMISSION)
  async getCommission() {
    const data = await this.adminService.getCommissionSettings();
    return { data };
  }

  @Patch('settings/commission')
  @Permissions(AdminPermission.FINANCE_COMMISSION)
  async updateCommission(
    @CurrentUser('id') adminId: number,
    @Body() body: UpdateCommissionSettingsDto,
  ) {
    await this.adminService.updateCommissionSettings(adminId, body);
    return { message: 'Đã cập nhật cấu hình hoa hồng' };
  }

  @Get('settings/social')
  @Permissions(AdminPermission.SETTINGS_MANAGE)
  async getSocialSettings() {
    const data = await this.settingsService.getPublicSocialConfig();
    return { data };
  }

  @Patch('settings/social')
  @Permissions(AdminPermission.SETTINGS_MANAGE)
  async updateSocialSettings(@Body() body: Partial<PublicSocialConfig>) {
    const data = await this.settingsService.updatePublicSocialConfig(body);
    return { data, message: 'Đã cập nhật cấu hình mạng xã hội' };
  }

  // ===== DASHBOARD =====

  @Get('dashboard/stats')
  @Permissions(AdminPermission.FINANCE_REVENUE)
  @ApiOperation({ summary: 'Get admin dashboard stats' })
  @ApiSuccessResponse('Admin dashboard stats')
  async getDashboardStats(@Query() filters: AdminDashboardQueryDto) {
    const data = await this.dashboardService.getDashboardStats(filters);
    return { data };
  }

  @Get('dashboard/chart-data')
  @Permissions(AdminPermission.FINANCE_REVENUE)
  async getDashboardChartData(@Query() filters: AdminDashboardQueryDto) {
    const data = await this.dashboardService.getDashboardChartData(filters);
    return { data };
  }

  @Get('dashboard/export-pdf')
  @Permissions(AdminPermission.FINANCE_REVENUE)
  async exportDashboardPdf(
    @Query() filters: AdminDashboardQueryDto,
    @Res() res: Response,
  ) {
    return this.dashboardService.exportDashboardPdf(res, filters);
  }

  @Get('dashboard/export-excel')
  @Permissions(AdminPermission.FINANCE_REVENUE)
  @HttpCode(HttpStatus.OK)
  async exportDashboardExcel(
    @Query() filters: AdminDashboardQueryDto,
    @Res() res: Response,
  ) {
    return this.dashboardService.exportDashboardExcel(res, filters);
  }

  // ===== AUDIT LOGS =====

  @Get('audit-logs')
  @Permissions(AdminPermission.AUDIT_LOG_VIEW)
  @ApiOperation({ summary: 'List business/security audit logs' })
  @ApiQuery({ name: 'actorId', required: false, type: Number })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'targetType', required: false, type: String })
  @ApiQuery({ name: 'targetId', required: false, type: Number })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({ name: 'keyword', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiSuccessResponse('Audit log list')
  async getAuditLogs(@Query() query: AdminAuditLogsQueryDto) {
    return this.auditLogService.getAuditLogs(query);
  }

  @Get('audit-logs/export')
  @Permissions(AdminPermission.AUDIT_LOG_VIEW)
  @ApiOperation({ summary: 'Export business/security audit logs as CSV' })
  @ApiQuery({ name: 'actorId', required: false, type: Number })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'targetType', required: false, type: String })
  @ApiQuery({ name: 'targetId', required: false, type: Number })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({ name: 'keyword', required: false, type: String })
  async exportAuditLogs(
    @Query() query: AdminAuditLogsQueryDto,
    @Res() res: Response,
  ) {
    const csv = await this.auditLogService.exportAuditLogsCsv(query);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="audit-logs.csv"',
    );
    return res.status(HttpStatus.OK).send(csv);
  }
}
