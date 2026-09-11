import {
  Controller,
  Get,
  Query,
  UseGuards,
  Res,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../common/decorators/api-contract.decorator';
import { AdminPermission } from '../../../common/constants/admin-permissions';
import { AdminDashboardQueryDto } from '../dto/admin.dto';
import { AdminDashboardService } from '../services/admin-dashboard.service';

@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF)
@ApiTags('admin-dashboard')
@ApiBearerAuth()
@ApiErrorResponses()
export class AdminDashboardController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  @Get('stats')
  @Permissions(AdminPermission.FINANCE_REVENUE)
  @ApiOperation({ summary: 'Get admin dashboard stats' })
  @ApiSuccessResponse('Admin dashboard stats')
  async getDashboardStats(@Query() filters: AdminDashboardQueryDto) {
    const data = await this.dashboardService.getDashboardStats(filters);
    return { data };
  }

  @Get('chart-data')
  @Permissions(AdminPermission.FINANCE_REVENUE)
  @ApiOperation({ summary: 'Get admin dashboard chart data' })
  async getDashboardChartData(@Query() filters: AdminDashboardQueryDto) {
    const data = await this.dashboardService.getDashboardChartData(filters);
    return { data };
  }

  @Get('export-pdf')
  @Permissions(AdminPermission.FINANCE_REVENUE)
  @ApiOperation({ summary: 'Export dashboard report as PDF' })
  async exportDashboardPdf(
    @Query() filters: AdminDashboardQueryDto,
    @Res() res: Response,
  ) {
    return this.dashboardService.exportDashboardPdf(res, filters);
  }

  @Get('export-excel')
  @Permissions(AdminPermission.FINANCE_REVENUE)
  @ApiOperation({ summary: 'Export dashboard report as Excel' })
  @HttpCode(HttpStatus.OK)
  async exportDashboardExcel(
    @Query() filters: AdminDashboardQueryDto,
    @Res() res: Response,
  ) {
    return this.dashboardService.exportDashboardExcel(res, filters);
  }
}

