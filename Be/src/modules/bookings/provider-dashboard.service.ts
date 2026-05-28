import { Injectable } from '@nestjs/common';
import { BookingStatus, Prisma } from '@prisma/client';
import { Workbook } from 'exceljs';
import PdfPrinter from 'pdfmake/js/Printer';
import { PrismaService } from '../../prisma/prisma.service';

export interface ProviderDashboardFilters {
  from?: string;
  to?: string;
  groupBy?: 'day' | 'week' | 'month';
  status?: string;
  serviceId?: string | number;
  categoryId?: string | number;
  reportType?: string;
}

type ProviderReportType = 'overview' | 'revenue' | 'status' | 'bookings';

type NormalizedProviderFilters = {
  from?: Date;
  to?: Date;
  groupBy: 'day' | 'week' | 'month';
  status?: BookingStatus;
  serviceId?: number;
  categoryId?: number;
  reportType: ProviderReportType;
};

@Injectable()
export class ProviderDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getProviderStats(
    providerId: number,
    filters: ProviderDashboardFilters = {},
  ) {
    const normalized = this.normalizeProviderDashboardFilters(filters);
    const where = this.buildProviderDashboardWhere(providerId, normalized);

    const [statusCounts, quotations, avgRating] = await Promise.all([
      this.prisma.booking.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),
      this.prisma.quotation.findMany({
        where: { booking: { ...where, status: BookingStatus.DONE } },
        select: {
          actualPrice: true,
          commissionRateSnapshot: true,
          booking: { select: { createdAt: true } },
        },
        orderBy: { booking: { createdAt: 'asc' } },
      }),
      this.prisma.review.aggregate({
        where: {
          service: {
            providerId,
            ...(normalized.categoryId
              ? { categoryId: normalized.categoryId }
              : {}),
            ...(normalized.serviceId ? { id: normalized.serviceId } : {}),
          },
        },
        _avg: { rating: true },
      }),
    ]);

    const statsMap = statusCounts.reduce(
      (acc, curr) => {
        acc[curr.status] = curr._count.id;
        return acc;
      },
      {} as Record<string, number>,
    );

    const totalBookings = statusCounts.reduce(
      (acc, curr) => acc + curr._count.id,
      0,
    );
    const totalRevenue = quotations.reduce(
      (sum, item) => sum + Number(item.actualPrice),
      0,
    );
    const commissionPaid = quotations.reduce(
      (sum, item) =>
        sum +
        (Number(item.actualPrice) * Number(item.commissionRateSnapshot)) / 100,
      0,
    );
    const revenueData = this.groupProviderRevenue(
      quotations,
      normalized.groupBy,
    );
    const cancelledCount = statsMap[BookingStatus.CANCELLED] || 0;

    return {
      totalBookings,
      pendingBookings: statsMap[BookingStatus.PENDING] || 0,
      pendingCount: statsMap[BookingStatus.PENDING] || 0,
      activeBookings:
        (statsMap[BookingStatus.QUOTED] || 0) +
        (statsMap[BookingStatus.CONFIRMED] || 0) +
        (statsMap[BookingStatus.IN_PROGRESS] || 0),
      inProgressCount:
        (statsMap[BookingStatus.QUOTED] || 0) +
        (statsMap[BookingStatus.CONFIRMED] || 0) +
        (statsMap[BookingStatus.IN_PROGRESS] || 0),
      doneBookings: statsMap[BookingStatus.DONE] || 0,
      doneCount: statsMap[BookingStatus.DONE] || 0,
      cancelledBookings: cancelledCount,
      totalRevenue,
      commissionPaid,
      avgRating: avgRating._avg.rating || 0,
      cancelRate: totalBookings ? (cancelledCount / totalBookings) * 100 : 0,
      revenueData,
      statusData: Object.values(BookingStatus).map((status) => ({
        status,
        count: statsMap[status] || 0,
      })),
      filterSummary: this.describeProviderDashboardFilters(normalized),
      reportType: normalized.reportType,
    };
  }

  async exportProviderPdf(
    providerId: number,
    filters: ProviderDashboardFilters = {},
  ) {
    const normalized = this.normalizeProviderDashboardFilters(filters);
    const stats = await this.getProviderStats(providerId, filters);
    const rows = await this.getProviderReportRows(providerId, filters);

    const fonts = {
      Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique',
      },
    };
    const printer = new PdfPrinter(fonts);
    const content: any[] = [
      {
        text: 'HomeService Marketplace',
        fontSize: 18,
        bold: true,
      },
      {
        text: this.providerReportTitle(normalized.reportType),
        fontSize: 14,
        bold: true,
        margin: [0, 0, 0, 10],
      },
      {
        text: `Ngay xuat: ${new Date().toLocaleString('vi-VN')}`,
        margin: [0, 0, 0, 4],
      },
      {
        text: `Dieu kien loc: ${stats.filterSummary}`,
        margin: [0, 0, 0, 16],
      },
    ];

    if (normalized.reportType === 'overview') {
      content.push({
        table: {
          headerRows: 1,
          widths: ['*', '*'],
          body: [
            ['Chi so', 'Gia tri'],
            ['Tong don hang', stats.totalBookings],
            ['Doanh thu', `${stats.totalRevenue.toLocaleString('vi-VN')} VND`],
            [
              'Hoa hong da tru',
              `${stats.commissionPaid.toLocaleString('vi-VN')} VND`,
            ],
            ['Hoan thanh', stats.doneBookings],
            ['Da huy', stats.cancelledBookings],
            ['Danh gia trung binh', Number(stats.avgRating).toFixed(1)],
            ['Ty le huy', `${stats.cancelRate.toFixed(1)}%`],
          ],
        },
        layout: 'lightHorizontalLines',
      });
    }

    if (['overview', 'revenue'].includes(normalized.reportType)) {
      content.push(
        { text: 'Doanh thu theo ky', bold: true, margin: [0, 18, 0, 6] },
        {
          table: {
            headerRows: 1,
            widths: ['*', '*'],
            body: [
              ['Ky', 'Doanh thu'],
              ...(stats.revenueData.length
                ? stats.revenueData.map((item) => [
                    item.period,
                    `${Number(item.revenue).toLocaleString('vi-VN')} VND`,
                  ])
                : [['-', '0 VND']]),
            ],
          },
          layout: 'lightHorizontalLines',
        },
      );
    }

    if (['overview', 'status'].includes(normalized.reportType)) {
      content.push(
        { text: 'Trang thai don hang', bold: true, margin: [0, 18, 0, 6] },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto'],
            body: [
              ['Trang thai', 'So don'],
              ...stats.statusData.map((item) => [item.status, item.count]),
            ],
          },
          layout: 'lightHorizontalLines',
        },
      );
    }

    if (['overview', 'bookings'].includes(normalized.reportType)) {
      content.push(
        { text: 'Don hang trong bao cao', bold: true, margin: [0, 18, 0, 6] },
        {
          table: {
            headerRows: 1,
            widths: ['auto', '*', 'auto', 'auto'],
            body: [
              ['Ma don', 'Dich vu', 'Trang thai', 'Gia tri'],
              ...(rows.length
                ? rows.map((booking) => [
                    booking.bookingCode,
                    booking.service?.name || '-',
                    booking.status,
                    booking.quotation?.actualPrice
                      ? `${Number(booking.quotation.actualPrice).toLocaleString('vi-VN')} VND`
                      : '-',
                  ])
                : [['-', 'Chua co du lieu', '-', '-']]),
            ],
          },
          layout: 'lightHorizontalLines',
        },
      );
    }

    content.push({
      columns: [
        { text: 'Nha cung cap', alignment: 'center' },
        { text: 'Nguoi xac nhan', alignment: 'center' },
      ],
      margin: [0, 32, 0, 0],
    });

    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [36, 42, 36, 48],
      defaultStyle: { font: 'Helvetica' },
      content,
    };

    return printer.createPdfKitDocument(docDefinition);
  }

  async exportProviderExcel(
    providerId: number,
    filters: ProviderDashboardFilters = {},
  ) {
    const normalized = this.normalizeProviderDashboardFilters(filters);
    const stats = await this.getProviderStats(providerId, filters);
    const rows = await this.getProviderReportRows(providerId, filters);
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Tong quan');

    worksheet.columns = [
      { header: 'Chi so', key: 'metric', width: 30 },
      { header: 'Gia tri', key: 'value', width: 25 },
    ];

    worksheet.addRows([
      {
        metric: 'Loai bao cao',
        value: this.providerReportTitle(normalized.reportType),
      },
      { metric: 'Dieu kien loc', value: stats.filterSummary },
      { metric: 'Tong don hang', value: stats.totalBookings },
      { metric: 'Doanh thu', value: stats.totalRevenue },
      { metric: 'Hoa hong da tru', value: stats.commissionPaid },
      { metric: 'Hoan thanh', value: stats.doneBookings },
      { metric: 'Da huy', value: stats.cancelledBookings },
      { metric: 'Ty le huy', value: stats.cancelRate },
      { metric: 'Generated At', value: new Date().toLocaleString('vi-VN') },
    ]);

    if (['overview', 'revenue'].includes(normalized.reportType)) {
      const revenueSheet = workbook.addWorksheet('Doanh thu');
      revenueSheet.columns = [
        { header: 'Ky', key: 'period', width: 20 },
        { header: 'Doanh thu', key: 'revenue', width: 20 },
      ];
      revenueSheet.addRows(stats.revenueData);
    }

    if (['overview', 'status'].includes(normalized.reportType)) {
      const statusSheet = workbook.addWorksheet('Trang thai');
      statusSheet.columns = [
        { header: 'Trang thai', key: 'status', width: 22 },
        { header: 'So don', key: 'count', width: 12 },
      ];
      statusSheet.addRows(stats.statusData);
    }

    if (['overview', 'bookings'].includes(normalized.reportType)) {
      const bookingSheet = workbook.addWorksheet('Don hang');
      bookingSheet.columns = [
        { header: 'Ma don', key: 'code', width: 18 },
        { header: 'Dich vu', key: 'service', width: 32 },
        { header: 'Khach hang', key: 'customer', width: 28 },
        { header: 'Trang thai', key: 'status', width: 18 },
        { header: 'Gia tri', key: 'value', width: 18 },
        { header: 'Ngay tao', key: 'createdAt', width: 22 },
      ];
      bookingSheet.addRows(
        rows.map((booking) => ({
          code: booking.bookingCode,
          service: booking.service?.name,
          customer: booking.customer?.fullName,
          status: booking.status,
          value: booking.quotation?.actualPrice
            ? Number(booking.quotation.actualPrice)
            : 0,
          createdAt: booking.createdAt.toLocaleString('vi-VN'),
        })),
      );
    }

    for (const sheet of workbook.worksheets) {
      sheet.getRow(1).font = { bold: true };
    }
    return workbook;
  }

  private async getProviderReportRows(
    providerId: number,
    filters: ProviderDashboardFilters,
  ) {
    const normalized = this.normalizeProviderDashboardFilters(filters);
    return this.prisma.booking.findMany({
      where: this.buildProviderDashboardWhere(providerId, normalized),
      include: {
        service: { select: { id: true, name: true } },
        customer: { select: { id: true, fullName: true } },
        quotation: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }

  private normalizeProviderDashboardFilters(
    filters: ProviderDashboardFilters,
  ): NormalizedProviderFilters {
    return {
      from: this.parseDashboardDate(filters.from, 'from'),
      to: this.parseDashboardDate(filters.to, 'to'),
      groupBy: this.parseDashboardGroupBy(filters.groupBy),
      status: this.parseDashboardStatus(filters.status),
      serviceId: this.parseDashboardNumber(filters.serviceId),
      categoryId: this.parseDashboardNumber(filters.categoryId),
      reportType: this.parseProviderReportType(filters.reportType),
    };
  }

  private buildProviderDashboardWhere(
    providerId: number,
    filters: NormalizedProviderFilters,
  ): Prisma.BookingWhereInput {
    const where: Prisma.BookingWhereInput = { providerId };
    if (filters.from || filters.to) {
      where.createdAt = {
        ...(filters.from ? { gte: filters.from } : {}),
        ...(filters.to ? { lte: filters.to } : {}),
      };
    }
    if (filters.status) where.status = filters.status;
    if (filters.serviceId) where.serviceId = filters.serviceId;
    if (filters.categoryId) where.service = { categoryId: filters.categoryId };
    return where;
  }

  private groupProviderRevenue(
    quotations: Array<{
      actualPrice: unknown;
      booking: { createdAt: Date };
    }>,
    groupBy: 'day' | 'week' | 'month',
  ) {
    const grouped = new Map<string, number>();
    for (const quotation of quotations) {
      const period = this.dashboardPeriodLabel(
        quotation.booking.createdAt,
        groupBy,
      );
      grouped.set(
        period,
        (grouped.get(period) || 0) + Number(quotation.actualPrice),
      );
    }
    return Array.from(grouped.entries()).map(([period, revenue]) => ({
      period,
      revenue,
    }));
  }

  private parseDashboardDate(value: string | undefined, edge: 'from' | 'to') {
    if (!value) return undefined;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return undefined;
    if (edge === 'to' && value.length <= 10) date.setHours(23, 59, 59, 999);
    return date;
  }

  private parseDashboardNumber(value: string | number | undefined) {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  }

  private parseDashboardStatus(value: string | undefined) {
    if (!value) return undefined;
    return Object.values(BookingStatus).includes(value as BookingStatus)
      ? (value as BookingStatus)
      : undefined;
  }

  private parseDashboardGroupBy(
    value: ProviderDashboardFilters['groupBy'] | undefined,
  ) {
    return ['day', 'week', 'month'].includes(value as string)
      ? (value as 'day' | 'week' | 'month')
      : 'month';
  }

  private parseProviderReportType(
    value: string | undefined,
  ): ProviderReportType {
    const allowed: ProviderReportType[] = [
      'overview',
      'revenue',
      'status',
      'bookings',
    ];
    return allowed.includes(value as ProviderReportType)
      ? (value as ProviderReportType)
      : 'overview';
  }

  private providerReportTitle(type: ProviderReportType) {
    const labels: Record<ProviderReportType, string> = {
      overview: 'Bao cao tong quan',
      revenue: 'Bao cao doanh thu',
      status: 'Bao cao trang thai don',
      bookings: 'Bao cao danh sach don',
    };
    return labels[type];
  }

  private dashboardPeriodLabel(date: Date, groupBy: 'day' | 'week' | 'month') {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    if (groupBy === 'day') return `${day}/${month}`;
    if (groupBy === 'week') {
      const first = new Date(year, 0, 1);
      const pastDays = (date.getTime() - first.getTime()) / 86400000;
      return `${year}-W${String(Math.ceil((pastDays + first.getDay() + 1) / 7)).padStart(2, '0')}`;
    }
    return `${month}/${year}`;
  }

  private describeProviderDashboardFilters(filters: NormalizedProviderFilters) {
    const parts = [
      `loai ${this.providerReportTitle(filters.reportType).toLowerCase()}`,
      filters.from ? `tu ${filters.from.toISOString().slice(0, 10)}` : '',
      filters.to ? `den ${filters.to.toISOString().slice(0, 10)}` : '',
      filters.status ? `trang thai ${filters.status}` : '',
      filters.categoryId ? `danh muc #${filters.categoryId}` : '',
      filters.serviceId ? `dich vu #${filters.serviceId}` : '',
      `nhom theo ${filters.groupBy}`,
    ].filter(Boolean);
    return parts.join(', ') || 'tat ca du lieu';
  }
}
