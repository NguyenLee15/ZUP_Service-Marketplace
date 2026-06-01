import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ProviderDashboardService } from './provider-dashboard.service';
import { ProviderDashboardQueryDto } from './dto/provider-dashboard-query.dto';

@Controller('provider/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PROVIDER')
@ApiTags('provider-dashboard')
@ApiBearerAuth()
export class ProviderDashboardController {
  constructor(
    private readonly providerDashboardService: ProviderDashboardService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get provider booking and revenue stats' })
  async getStats(
    @CurrentUser('id') providerId: number,
    @Query() filters: ProviderDashboardQueryDto,
  ) {
    const stats = await this.providerDashboardService.getProviderStats(
      providerId,
      filters,
    );
    return { data: stats };
  }

  @Get('export-pdf')
  @ApiOperation({ summary: 'Export provider dashboard as PDF' })
  async exportPdf(
    @CurrentUser('id') providerId: number,
    @Query() filters: ProviderDashboardQueryDto,
    @Res() res: Response,
  ) {
    const pdfDoc = await this.providerDashboardService.exportProviderPdf(
      providerId,
      filters,
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=provider-report-${filters.from || 'all'}-${filters.to || new Date().toISOString().slice(0, 10)}.pdf`,
    );
    pdfDoc.pipe(res);
    pdfDoc.end();
  }

  @Get('export-excel')
  @ApiOperation({ summary: 'Export provider dashboard as Excel' })
  async exportExcel(
    @CurrentUser('id') providerId: number,
    @Query() filters: ProviderDashboardQueryDto,
    @Res() res: Response,
  ) {
    const workbook = await this.providerDashboardService.exportProviderExcel(
      providerId,
      filters,
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=provider-report-${filters.from || 'all'}-${filters.to || new Date().toISOString().slice(0, 10)}.xlsx`,
    );
    await workbook.xlsx.write(res);
    res.end();
  }
}
