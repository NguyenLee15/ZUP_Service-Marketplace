import { Injectable } from '@nestjs/common';
import type { Response } from 'express';
import { Workbook } from 'exceljs';
import PdfPrinter from 'pdfmake/js/Printer';
import { BookingStatus, Prisma, ServiceStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

export type DashboardGroupBy = 'day' | 'week' | 'month';

export interface DashboardReportFilters {
  from?: string;
  to?: string;
  groupBy?: DashboardGroupBy;
  status?: string;
  providerId?: string | number;
  categoryId?: string | number;
  serviceId?: string | number;
}

type NormalizedFilters = {
  from?: Date;
  to?: Date;
  groupBy: DashboardGroupBy;
  status?: BookingStatus;
  providerId?: number;
  categoryId?: number;
  serviceId?: number;
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ xử lý',
  QUOTED: 'Đã báo giá',
  CONFIRMED: 'Đã xác nhận',
  IN_PROGRESS: 'Đang thực hiện',
  DONE: 'Hoàn thành',
  DISPUTED: 'Khiếu nại',
  CANCELLED: 'Đã hủy',
};

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats(filters: DashboardReportFilters = {}) {
    const normalized = this.normalizeFilters(filters);
    const bookingWhere = this.buildBookingWhere(normalized);
    const serviceWhere = this.buildServiceWhere(normalized);

    const [
      totalBookings,
      totalUsers,
      totalProviders,
      totalServices,
      statusCounts,
      quotations,
    ] = await Promise.all([
      this.prisma.booking.count({ where: bookingWhere }),
      this.prisma.user.count({
        where: { role: UserRole.CUSTOMER, status: 'ACTIVE' },
      }),
      this.prisma.user.count({
        where: { role: UserRole.PROVIDER, status: 'ACTIVE' },
      }),
      this.prisma.service.count({ where: serviceWhere }),
      this.prisma.booking.groupBy({
        by: ['status'],
        where: bookingWhere,
        _count: { id: true },
      }),
      this.prisma.quotation.findMany({
        where: { booking: { ...bookingWhere, status: BookingStatus.DONE }, status: 'ACCEPTED' },
        select: { actualPrice: true, commissionRateSnapshot: true },
      }),
    ]);

    const statsMap = this.toStatusMap(statusCounts);
    const totalRevenue = quotations.reduce(
      (sum, item) => sum + Number(item.actualPrice),
      0,
    );
    const commissionRevenue = quotations.reduce(
      (sum, item) =>
        sum +
        (Number(item.actualPrice) * Number(item.commissionRateSnapshot)) / 100,
      0,
    );

    return {
      totalBookings,
      totalUsers,
      totalProviders,
      totalServices,
      activeBookings:
        (statsMap[BookingStatus.QUOTED] || 0) +
        (statsMap[BookingStatus.CONFIRMED] || 0) +
        (statsMap[BookingStatus.IN_PROGRESS] || 0),
      pendingBookings: statsMap[BookingStatus.PENDING] || 0,
      doneBookings: statsMap[BookingStatus.DONE] || 0,
      cancelledBookings: statsMap[BookingStatus.CANCELLED] || 0,
      totalRevenue,
      commissionRevenue,
      avgOrderValue: quotations.length ? totalRevenue / quotations.length : 0,
      filterSummary: this.describeFilters(normalized),
    };
  }

  async getDashboardChartData(filters: DashboardReportFilters = {}) {
    const normalized = this.normalizeFilters(filters);
    const bookingWhere = this.buildBookingWhere(normalized);

    const [statusCounts, quotations, bookings, filterOptions] =
      await Promise.all([
        this.prisma.booking.groupBy({
          by: ['status'],
          where: bookingWhere,
          _count: { id: true },
        }),
        this.prisma.quotation.findMany({
          where: { booking: { ...bookingWhere, status: BookingStatus.DONE }, status: 'ACCEPTED' },
          select: {
            actualPrice: true,
            commissionRateSnapshot: true,
            booking: { select: { createdAt: true } },
          },
          orderBy: { booking: { createdAt: 'asc' } },
        }),
        this.prisma.booking.findMany({
          where: bookingWhere,
          select: {
            province: true,
            service: {
              select: {
                id: true,
                name: true,
                category: { select: { id: true, name: true } },
              },
            },
          },
        }),
        this.getFilterOptions(),
      ]);

    const revenueMap = new Map<string, number>();
    for (const item of quotations) {
      const label = this.periodLabel(
        item.booking.createdAt,
        normalized.groupBy,
      );
      const commission =
        (Number(item.actualPrice) * Number(item.commissionRateSnapshot)) / 100;
      revenueMap.set(label, (revenueMap.get(label) || 0) + commission);
    }

    return {
      revenueData: Array.from(revenueMap.entries()).map(
        ([month, commission]) => ({
          month,
          commission,
        }),
      ),
      statusData: statusCounts.map((item) => ({
        status: STATUS_LABELS[item.status] || item.status,
        count: item._count.id,
      })),
      provinceData: this.groupCount(
        bookings.map((item) => item.province || 'Chưa có tỉnh/thành'),
      ),
      categoryData: this.groupCount(
        bookings.map(
          (item) => item.service?.category?.name || 'Chưa có danh mục',
        ),
      ),
      serviceData: this.groupCount(
        bookings.map((item) => item.service?.name || 'Chưa có dịch vụ'),
        8,
      ),
      filterOptions,
      filterSummary: this.describeFilters(normalized),
    };
  }

  async exportDashboardPdf(
    res: Response,
    filters: DashboardReportFilters = {},
  ) {
    const [stats, chartData, rows] = await Promise.all([
      this.getDashboardStats(filters),
      this.getDashboardChartData(filters),
      this.getRecentBookings(filters),
    ]);

    const printer = new PdfPrinter(this.getFonts());
    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [36, 42, 36, 48],
      defaultStyle: { font: 'Helvetica', fontSize: 10 },
      content: [
        { text: 'HomeService Marketplace', fontSize: 18, bold: true },
        {
          text: 'Bao cao quan tri he thong',
          fontSize: 14,
          bold: true,
          margin: [0, 4, 0, 8],
        },
        { text: `Ngay xuat: ${this.formatDateTime(new Date())}` },
        {
          text: `Dieu kien loc: ${stats.filterSummary}`,
          margin: [0, 0, 0, 14],
        },
        this.kpiTable([
          ['Tong don hang', stats.totalBookings],
          ['Dang xu ly', stats.activeBookings],
          ['Da hoan thanh', stats.doneBookings],
          ['Doanh thu', this.formatCurrency(stats.totalRevenue)],
          ['Hoa hong uoc tinh', this.formatCurrency(stats.commissionRevenue)],
          ['Dich vu dang cung cap', stats.totalServices],
        ]),
        { text: 'Doanh thu theo ky', bold: true, margin: [0, 16, 0, 6] },
        this.simpleTable(
          ['Ky', 'Hoa hong'],
          chartData.revenueData.map((item) => [
            item.month,
            this.formatCurrency(item.commission),
          ]),
        ),
        { text: 'Don hang gan nhat', bold: true, margin: [0, 16, 0, 6] },
        this.simpleTable(
          ['Ma don', 'Dich vu', 'Nha cung cap', 'Trang thai', 'Gia tri'],
          rows.map((item) => [
            item.bookingCode,
            item.service?.name || '-',
            item.provider?.fullName || '-',
            STATUS_LABELS[item.status] || item.status,
            (item.quotations && item.quotations.length > 0)
              ? this.formatCurrency(item.quotations.reduce((s, q) => s + Number(q.actualPrice), 0))
              : '-',
          ]),
        ),
        {
          columns: [
            { text: 'Nguoi lap bao cao', alignment: 'center' },
            { text: 'Nguoi phe duyet', alignment: 'center' },
          ],
          margin: [0, 32, 0, 0],
        },
      ],
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${this.reportFileName('admin-report', filters, 'pdf')}`,
    );
    pdfDoc.pipe(res);
    pdfDoc.end();
  }

  async exportDashboardExcel(
    res: Response,
    filters: DashboardReportFilters = {},
  ) {
    const [stats, chartData, rows] = await Promise.all([
      this.getDashboardStats(filters),
      this.getDashboardChartData(filters),
      this.getRecentBookings(filters),
    ]);

    const workbook = new Workbook();
    workbook.creator = 'HomeService';
    workbook.created = new Date();

    const overview = workbook.addWorksheet('Tong quan');
    overview.columns = [
      { header: 'Chi so', key: 'metric', width: 30 },
      { header: 'Gia tri', key: 'value', width: 28 },
    ];
    overview.addRows([
      { metric: 'Dieu kien loc', value: stats.filterSummary },
      { metric: 'Tong don hang', value: stats.totalBookings },
      { metric: 'Dang xu ly', value: stats.activeBookings },
      { metric: 'Hoan thanh', value: stats.doneBookings },
      { metric: 'Da huy', value: stats.cancelledBookings },
      { metric: 'Doanh thu', value: stats.totalRevenue },
      { metric: 'Hoa hong uoc tinh', value: stats.commissionRevenue },
      { metric: 'Gia tri don trung binh', value: stats.avgOrderValue },
    ]);

    const revenue = workbook.addWorksheet('Doanh thu');
    revenue.columns = [
      { header: 'Ky', key: 'period', width: 20 },
      { header: 'Hoa hong', key: 'commission', width: 20 },
    ];
    revenue.addRows(
      chartData.revenueData.map((item) => ({
        period: item.month,
        commission: item.commission,
      })),
    );

    const status = workbook.addWorksheet('Trang thai');
    status.columns = [
      { header: 'Trang thai', key: 'status', width: 24 },
      { header: 'So don', key: 'count', width: 14 },
    ];
    status.addRows(chartData.statusData);

    const bookings = workbook.addWorksheet('Don hang');
    bookings.columns = [
      { header: 'Ma don', key: 'code', width: 18 },
      { header: 'Dich vu', key: 'service', width: 32 },
      { header: 'Nha cung cap', key: 'provider', width: 28 },
      { header: 'Khach hang', key: 'customer', width: 28 },
      { header: 'Trang thai', key: 'status', width: 18 },
      { header: 'Gia tri', key: 'value', width: 18 },
      { header: 'Ngay tao', key: 'createdAt', width: 22 },
    ];
    bookings.addRows(
      rows.map((item) => ({
        code: item.bookingCode,
        service: item.service?.name,
        provider: item.provider?.fullName,
        customer: item.customer?.fullName,
        status: STATUS_LABELS[item.status] || item.status,
        value: (item.quotations && item.quotations.length > 0)
          ? item.quotations.reduce((s, q) => s + Number(q.actualPrice), 0)
          : 0,
        createdAt: this.formatDateTime(item.createdAt),
      })),
    );

    for (const sheet of workbook.worksheets) {
      sheet.getRow(1).font = { bold: true };
      sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE7EDF6' },
      };
    }

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${this.reportFileName('admin-report', filters, 'xlsx')}`,
    );
    await workbook.xlsx.write(res);
    res.end();
  }

  private async getRecentBookings(filters: DashboardReportFilters) {
    const normalized = this.normalizeFilters(filters);
    return this.prisma.booking.findMany({
      where: this.buildBookingWhere(normalized),
      include: {
        service: { select: { id: true, name: true } },
        provider: { select: { id: true, fullName: true } },
        customer: { select: { id: true, fullName: true } },
        quotations: { where: { status: 'ACCEPTED' } },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }

  private async getFilterOptions() {
    const [providers, categories, services] = await Promise.all([
      this.prisma.user.findMany({
        where: { role: UserRole.PROVIDER, status: 'ACTIVE' },
        select: { id: true, fullName: true },
        orderBy: { fullName: 'asc' },
        take: 200,
      }),
      this.prisma.serviceCategory.findMany({
        where: { isDeleted: false },
        select: { id: true, name: true },
        orderBy: [{ name: 'asc' }],
        take: 300,
      }),
      this.prisma.service.findMany({
        where: { status: ServiceStatus.ACTIVE, isDeleted: false },
        select: {
          id: true,
          name: true,
          provider: { select: { fullName: true } },
          category: { select: { name: true } },
        },
        orderBy: { name: 'asc' },
        take: 300,
      }),
    ]);

    return { providers, categories, services };
  }

  private groupCount(values: string[], limit = 10) {
    const counts = new Map<string, number>();
    for (const value of values) {
      counts.set(value, (counts.get(value) || 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  private normalizeFilters(filters: DashboardReportFilters): NormalizedFilters {
    return {
      from: this.parseDate(filters.from, 'from'),
      to: this.parseDate(filters.to, 'to'),
      groupBy: filters.groupBy || 'month',
      status: this.parseStatus(filters.status),
      providerId: this.parseNumber(filters.providerId),
      categoryId: this.parseNumber(filters.categoryId),
      serviceId: this.parseNumber(filters.serviceId),
    };
  }

  private buildBookingWhere(
    filters: NormalizedFilters,
  ): Prisma.BookingWhereInput {
    const where: Prisma.BookingWhereInput = {};
    if (filters.from || filters.to) {
      where.createdAt = {
        ...(filters.from ? { gte: filters.from } : {}),
        ...(filters.to ? { lte: filters.to } : {}),
      };
    }
    if (filters.status) where.status = filters.status;
    if (filters.providerId) where.providerId = filters.providerId;
    if (filters.serviceId) where.serviceId = filters.serviceId;
    if (filters.categoryId) {
      where.service = { categoryId: filters.categoryId };
    }
    return where;
  }

  private buildServiceWhere(
    filters: NormalizedFilters,
  ): Prisma.ServiceWhereInput {
    return {
      status: ServiceStatus.ACTIVE,
      isDeleted: false,
      ...(filters.providerId ? { providerId: filters.providerId } : {}),
      ...(filters.serviceId ? { id: filters.serviceId } : {}),
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    };
  }

  private toStatusMap(
    rows: Array<{ status: BookingStatus; _count: { id: number } }>,
  ) {
    return rows.reduce(
      (acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  private parseDate(value: string | undefined, edge: 'from' | 'to') {
    if (!value) return undefined;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return undefined;
    if (edge === 'to' && value.length <= 10) {
      date.setHours(23, 59, 59, 999);
    }
    return date;
  }

  private parseNumber(value: string | number | undefined) {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  }

  private parseStatus(value: string | undefined) {
    if (!value) return undefined;
    return Object.values(BookingStatus).includes(value as BookingStatus)
      ? (value as BookingStatus)
      : undefined;
  }

  private periodLabel(date: Date, groupBy: DashboardGroupBy) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    if (groupBy === 'day') return `${day}/${month}`;
    if (groupBy === 'week') return `${year}-W${this.weekOfYear(date)}`;
    return `${month}/${year}`;
  }

  private weekOfYear(date: Date) {
    const firstDay = new Date(date.getFullYear(), 0, 1);
    const pastDays = (date.getTime() - firstDay.getTime()) / 86400000;
    return String(Math.ceil((pastDays + firstDay.getDay() + 1) / 7)).padStart(
      2,
      '0',
    );
  }

  private describeFilters(filters: NormalizedFilters) {
    const groupLabels: Record<DashboardGroupBy, string> = {
      day: 'ngày',
      week: 'tuần',
      month: 'tháng',
    };
    const parts = [
      filters.from ? `Từ ${this.formatDate(filters.from)}` : '',
      filters.to ? `đến ${this.formatDate(filters.to)}` : '',
      filters.status
        ? `trạng thái ${STATUS_LABELS[filters.status] || filters.status}`
        : '',
      filters.providerId ? `theo nhà cung cấp đã chọn` : '',
      filters.categoryId ? `theo danh mục đã chọn` : '',
      filters.serviceId ? `theo dịch vụ đã chọn` : '',
      `nhóm theo ${groupLabels[filters.groupBy]}`,
    ].filter(Boolean);
    return parts.join(', ') || 'Tất cả dữ liệu';
  }

  private reportFileName(
    prefix: string,
    filters: DashboardReportFilters,
    ext: string,
  ) {
    const normalized = this.normalizeFilters(filters);
    const from = normalized.from ? this.isoDate(normalized.from) : 'all';
    const to = normalized.to
      ? this.isoDate(normalized.to)
      : this.isoDate(new Date());
    return `${prefix}-${from}-${to}.${ext}`;
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

  private kpiTable(rows: Array<[string, string | number]>) {
    return this.simpleTable(['Chi so', 'Gia tri'], rows);
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

  private isoDate(date: Date) {
    return date.toISOString().slice(0, 10);
  }

  private formatCurrency(value: number) {
    return `${Math.round(value).toLocaleString('vi-VN')} VND`;
  }
}
