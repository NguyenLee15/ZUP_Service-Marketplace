import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ProviderDashboardService } from './provider-dashboard.service';

@Controller('provider/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PROVIDER')
export class ProviderDashboardController {
  constructor(
    private readonly providerDashboardService: ProviderDashboardService,
  ) {}

  @Get('stats')
  async getStats(
    @CurrentUser('id') providerId: number,
    @Query() filters: Record<string, string>,
  ) {
    const stats = await this.providerDashboardService.getProviderStats(
      providerId,
      filters,
    );
    return { data: stats };
  }

  @Get('export-pdf')
  async exportPdf(
    @CurrentUser('id') providerId: number,
    @Query() filters: Record<string, string>,
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
  async exportExcel(
    @CurrentUser('id') providerId: number,
    @Query() filters: Record<string, string>,
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
