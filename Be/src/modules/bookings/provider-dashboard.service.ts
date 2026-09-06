import { Injectable } from '@nestjs/common';
import { BookingStatus, Prisma } from '@prisma/client';
import { Workbook } from 'exceljs';
import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
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

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  QUOTED: 'Đã báo giá',
  CONFIRMED: 'Đã xác nhận',
  IN_PROGRESS: 'Đang thực hiện',
  DONE: 'Hoàn thành',
  DISPUTED: 'Khiếu nại',
  CANCELLED: 'Đã hủy',
};

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
        where: {
          booking: { ...where, status: BookingStatus.DONE },
          status: 'ACCEPTED',
        },
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

    const printer = new PdfPrinter(this.getFonts());
    const content: Content[] = [
      {
        text: 'Zup Đối Tác',
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
        text: `Ngày xuất: ${this.formatDateTime(new Date())}`,
        margin: [0, 0, 0, 4],
      },
      {
        text: `Điều kiện lọc: ${stats.filterSummary}`,
        margin: [0, 0, 0, 16],
      },
    ];

    if (normalized.reportType === 'overview') {
      content.push(
        this.simpleTable(
          ['Chỉ số', 'Giá trị'],
          [
            ['Tổng đơn hàng', stats.totalBookings],
            ['Doanh thu', this.formatCurrency(stats.totalRevenue)],
            ['Hoa hồng đã trừ', this.formatCurrency(stats.commissionPaid)],
            ['Hoàn thành', stats.doneBookings],
            ['Đã hủy', stats.cancelledBookings],
            ['Đánh giá trung bình', Number(stats.avgRating).toFixed(1)],
            ['Tỷ lệ hủy', `${stats.cancelRate.toFixed(1)}%`],
          ],
        ),
      );
    }

    if (['overview', 'revenue'].includes(normalized.reportType)) {
      content.push(
        { text: 'Doanh thu theo kỳ', bold: true, margin: [0, 18, 0, 6] },
        this.simpleTable(
          ['Kỳ', 'Doanh thu'],
          stats.revenueData.map((item) => [
            item.period,
            this.formatCurrency(Number(item.revenue)),
          ]),
        ),
      );
    }

    if (['overview', 'status'].includes(normalized.reportType)) {
      content.push(
        { text: 'Trạng thái đơn hàng', bold: true, margin: [0, 18, 0, 6] },
        this.simpleTable(
          ['Trạng thái', 'Số đơn'],
          stats.statusData.map((item) => [
            STATUS_LABELS[item.status] || item.status,
            item.count,
          ]),
        ),
      );
    }

    if (['overview', 'bookings'].includes(normalized.reportType)) {
      content.push(
        { text: 'Đơn hàng trong báo cáo', bold: true, margin: [0, 18, 0, 6] },
        this.simpleTable(
          ['Mã đơn', 'Dịch vụ', 'Trạng thái', 'Giá trị'],
          rows.map((booking) => [
            booking.bookingCode,
            booking.service?.name || '-',
            STATUS_LABELS[booking.status] || booking.status,
            booking.quotations && booking.quotations.length > 0
              ? this.formatCurrency(
                  booking.quotations.reduce(
                    (s, q) => s + Number(q.actualPrice),
                    0,
                  ),
                )
              : '-',
          ]),
        ),
      );
    }

    content.push({
      columns: [
        { text: 'Nhà cung cấp', alignment: 'center' },
        { text: 'Người xác nhận', alignment: 'center' },
      ],
      margin: [0, 32, 0, 0],
    });

    const docDefinition: TDocumentDefinitions = {
      pageSize: 'A4',
      pageMargins: [36, 42, 36, 48],
      defaultStyle: { font: 'Helvetica', fontSize: 10 },
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
        metric: 'Loại báo cáo',
        value: this.providerReportTitle(normalized.reportType),
      },
      { metric: 'Điều kiện lọc', value: stats.filterSummary },
      { metric: 'Tổng đơn hàng', value: stats.totalBookings },
      { metric: 'Doanh thu', value: stats.totalRevenue },
      { metric: 'Hoa hồng đã trừ', value: stats.commissionPaid },
      { metric: 'Hoàn thành', value: stats.doneBookings },
      { metric: 'Đã hủy', value: stats.cancelledBookings },
      { metric: 'Tỷ lệ hủy', value: stats.cancelRate },
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
          status: STATUS_LABELS[booking.status] || booking.status,
          value:
            booking.quotations && booking.quotations.length > 0
              ? booking.quotations.reduce(
                  (s, q) => s + Number(q.actualPrice),
                  0,
                )
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
        quotations: { where: { status: 'ACCEPTED' } },
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
      overview: 'Báo cáo tổng quan',
      revenue: 'Báo cáo doanh thu',
      status: 'Báo cáo trạng thái đơn',
      bookings: 'Báo cáo danh sách đơn',
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
      `loại ${this.providerReportTitle(filters.reportType).toLowerCase()}`,
      filters.from ? `từ ${this.formatDate(filters.from)}` : '',
      filters.to ? `đến ${this.formatDate(filters.to)}` : '',
      filters.status
        ? `trạng thái ${STATUS_LABELS[filters.status] || filters.status}`
        : '',
      filters.categoryId ? `danh mục #${filters.categoryId}` : '',
      filters.serviceId ? `dịch vụ #${filters.serviceId}` : '',
      `nhóm theo ${this.groupByLabel(filters.groupBy)}`,
    ].filter(Boolean);
    return parts.join(', ') || 'tất cả dữ liệu';
  }

  private getFonts() {
    return {
      Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique',
      },
    };
  }

  private simpleTable(headers: string[], rows: Array<Array<string | number>>) {
    return {
      table: {
        headerRows: 1,
        widths: headers.map(() => '*'),
        body: [
          headers.map((header) => ({ text: header, bold: true })),
          ...(rows.length ? rows : [headers.map(() => '-')]),
        ],
      },
      layout: 'lightHorizontalLines',
    };
  }

  private formatDateTime(date: Date) {
    return new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'Asia/Ho_Chi_Minh',
    }).format(date);
  }

  private formatDate(date: Date) {
    return new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'short',
      timeZone: 'Asia/Ho_Chi_Minh',
    }).format(date);
  }

  private formatCurrency(value: number) {
    return `${Math.round(value || 0).toLocaleString('vi-VN')} VND`;
  }

  private groupByLabel(groupBy: 'day' | 'week' | 'month') {
    return { day: 'ngày', week: 'tuần', month: 'tháng' }[groupBy];
  }
}
