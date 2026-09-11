import { Controller, Get, Patch, UseGuards, Body, Ip } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ApiErrorResponses } from '../../../common/decorators/api-contract.decorator';
import { AdminPermission } from '../../../common/constants/admin-permissions';
import {
  UpdateCommissionSettingsDto,
  UpdateSocialConfigDto,
} from '../dto/admin.dto';
import { AdminService } from '../services/admin.service';
import { SettingsService } from '../../settings/settings.service';

@Controller('admin/settings')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF)
@ApiTags('admin-finance')
@ApiBearerAuth()
@ApiErrorResponses()
export class AdminFinanceController {
  constructor(
    private readonly adminService: AdminService,
    private readonly settingsService: SettingsService,
  ) {}

  @Get('commission')
  @Permissions(AdminPermission.FINANCE_COMMISSION)
  @ApiOperation({ summary: 'Get system commission settings' })
  async getCommission() {
    const data = await this.adminService.getCommissionSettings();
    return { data };
  }

  @Patch('commission')
  @Permissions(AdminPermission.FINANCE_COMMISSION)
  @ApiOperation({ summary: 'Update system commission rate and boundaries' })
  async updateCommission(
    @CurrentUser('id') adminId: number,
    @Body() body: UpdateCommissionSettingsDto,
    @Ip() ip: string,
  ) {
    await this.adminService.updateCommissionSettings(adminId, body, ip);
    return { message: 'Đã cập nhật cấu hình hoa hồng' };
  }

  @Get('social')
  @Permissions(AdminPermission.SETTINGS_MANAGE)
  @ApiOperation({ summary: 'Get public social configuration' })
  async getSocialSettings() {
    const data = await this.settingsService.getPublicSocialConfig();
    return { data };
  }

  @Patch('social')
  @Permissions(AdminPermission.SETTINGS_MANAGE)
  @ApiOperation({ summary: 'Update public social configuration' })
  async updateSocialSettings(@Body() body: UpdateSocialConfigDto) {
    const data = await this.settingsService.updatePublicSocialConfig(body);
    return { data, message: 'Đã cập nhật cấu hình mạng xã hội' };
  }
}
