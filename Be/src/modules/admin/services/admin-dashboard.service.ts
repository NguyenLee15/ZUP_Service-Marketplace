import { Injectable } from '@nestjs/common';
import type { Response } from 'express';
import { BookingStatus, Prisma, ServiceStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AdminDashboardExportService } from './admin-dashboard-export.service';

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
  constructor(
    private readonly prisma: PrismaService,
    private readonly exportService: AdminDashboardExportService,
  ) {}

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
      financialAggregate,
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
      this.prisma.$queryRaw<
        Array<{
          totalRevenue: number | string | null;
          commissionRevenue: number | string | null;
          quotationCount: number;
        }>
      >(this.buildFinancialAggregateQuery(normalized)),
    ]);

    const statsMap = this.toStatusMap(statusCounts);
    const financial = financialAggregate[0];
    const totalRevenue = Number(financial?.totalRevenue || 0);
    const commissionRevenue = Number(financial?.commissionRevenue || 0);
    const quotationCount = financial?.quotationCount || 0;

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
      avgOrderValue: quotationCount ? totalRevenue / quotationCount : 0,
      filterSummary: this.describeFilters(normalized),
      isTruncated: false,
    };
  }

  async getDashboardChartData(filters: DashboardReportFilters = {}) {
    const normalized = this.normalizeFilters(filters);
    const bookingWhere = this.buildBookingWhere(normalized);

    const [
      statusCounts,
      revenueRows,
      provinceRows,
      categoryRows,
      serviceRows,
      filterOptions,
    ] = await Promise.all([
      this.prisma.booking.groupBy({
        by: ['status'],
        where: bookingWhere,
        _count: { id: true },
      }),
      this.prisma.$queryRaw<
        Array<{ period: Date; commission: number | string }>
      >(this.buildRevenueChartQuery(normalized)),
      this.prisma.$queryRaw<Array<{ name: string; count: number }>>(
        this.buildProvinceChartQuery(normalized),
      ),
      this.prisma.$queryRaw<Array<{ name: string; count: number }>>(
        this.buildCategoryChartQuery(normalized),
      ),
      this.prisma.$queryRaw<Array<{ name: string; count: number }>>(
        this.buildServiceChartQuery(normalized),
      ),
      this.getFilterOptions(),
    ]);

    return {
      revenueData: revenueRows.map((row) => ({
        month: this.periodLabel(new Date(row.period), normalized.groupBy),
        commission: Number(row.commission),
      })),
      statusData: statusCounts.map((item) => ({
        status: STATUS_LABELS[item.status] || item.status,
        count: item._count.id,
      })),
      provinceData: provinceRows,
      categoryData: categoryRows,
      serviceData: serviceRows,
      filterOptions,
      filterSummary: this.describeFilters(normalized),
    };
  }

  private buildFinancialAggregateQuery(filters: NormalizedFilters) {
    const conditions = this.buildDashboardSqlConditions(filters, false);
    return Prisma.sql`
      SELECT
        COALESCE(SUM(q.actual_price), 0)::numeric AS "totalRevenue",
        COALESCE(SUM(q.actual_price * q.commission_rate_snapshot / 100), 0)::numeric AS "commissionRevenue",
        COUNT(*)::int AS "quotationCount"
      FROM quotations q
      INNER JOIN bookings b ON b.id = q.booking_id
      INNER JOIN services s ON s.id = b.service_id
      WHERE q.status = 'ACCEPTED'
        AND b.status = 'DONE'
        AND ${Prisma.join(conditions, ' AND ')}
    `;
  }

  private buildRevenueChartQuery(filters: NormalizedFilters) {
    const conditions = this.buildDashboardSqlConditions(filters, false);
    const periodExpression = this.buildPeriodExpression(filters.groupBy);
    return Prisma.sql`
      SELECT
        ${periodExpression} AS period,
        COALESCE(SUM(q.actual_price * q.commission_rate_snapshot / 100), 0)::numeric AS commission
      FROM quotations q
      INNER JOIN bookings b ON b.id = q.booking_id
      INNER JOIN services s ON s.id = b.service_id
      WHERE q.status = 'ACCEPTED'
        AND b.status = 'DONE'
        AND ${Prisma.join(conditions, ' AND ')}
      GROUP BY ${periodExpression}
      ORDER BY ${periodExpression} ASC
    `;
  }

  private buildProvinceChartQuery(filters: NormalizedFilters) {
    const conditions = this.buildDashboardSqlConditions(filters);
    return Prisma.sql`
      SELECT COALESCE(b.province, 'Chưa có tỉnh/thành') AS name,
        COUNT(*)::int AS count
      FROM bookings b
      INNER JOIN services s ON s.id = b.service_id
      WHERE ${Prisma.join(conditions, ' AND ')}
      GROUP BY b.province
      ORDER BY count DESC
      LIMIT 10
    `;
  }

  private buildCategoryChartQuery(filters: NormalizedFilters) {
    const conditions = this.buildDashboardSqlConditions(filters);
    return Prisma.sql`
      SELECT COALESCE(c.name, 'Chưa có danh mục') AS name,
        COUNT(*)::int AS count
      FROM bookings b
      INNER JOIN services s ON s.id = b.service_id
      LEFT JOIN service_categories c ON c.id = s.category_id
      WHERE ${Prisma.join(conditions, ' AND ')}
      GROUP BY c.name
      ORDER BY count DESC
      LIMIT 10
    `;
  }

  private buildServiceChartQuery(filters: NormalizedFilters) {
    const conditions = this.buildDashboardSqlConditions(filters);
    return Prisma.sql`
      SELECT COALESCE(s.name, 'Chưa có dịch vụ') AS name,
        COUNT(*)::int AS count
      FROM bookings b
      INNER JOIN services s ON s.id = b.service_id
      WHERE ${Prisma.join(conditions, ' AND ')}
      GROUP BY s.name
      ORDER BY count DESC
      LIMIT 8
    `;
  }

  private buildDashboardSqlConditions(
    filters: NormalizedFilters,
    includeStatus = true,
  ): Prisma.Sql[] {
    const conditions: Prisma.Sql[] = [Prisma.sql`TRUE`];
    if (filters.from)
      conditions.push(Prisma.sql`b.created_at >= ${filters.from}`);
    if (filters.to) conditions.push(Prisma.sql`b.created_at <= ${filters.to}`);
    if (includeStatus && filters.status) {
      conditions.push(Prisma.sql`b.status = ${filters.status}`);
    }
    if (filters.providerId) {
      conditions.push(Prisma.sql`b.provider_id = ${filters.providerId}`);
    }
    if (filters.serviceId) {
      conditions.push(Prisma.sql`b.service_id = ${filters.serviceId}`);
    }
    if (filters.categoryId) {
      conditions.push(Prisma.sql`s.category_id = ${filters.categoryId}`);
    }
    return conditions;
  }

  private buildPeriodExpression(groupBy: DashboardGroupBy) {
    if (groupBy === 'day') return Prisma.sql`DATE_TRUNC('day', b.created_at)`;
    if (groupBy === 'week') return Prisma.sql`DATE_TRUNC('week', b.created_at)`;
    return Prisma.sql`DATE_TRUNC('month', b.created_at)`;
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

    return this.exportService.exportPdf(res, stats, chartData, rows, filters);
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

    return this.exportService.exportExcel(res, stats, chartData, rows, filters);
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

  private formatDate(date: Date) {
    return new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'short',
      timeZone: 'Asia/Ho_Chi_Minh',
    }).format(date);
  }
}
