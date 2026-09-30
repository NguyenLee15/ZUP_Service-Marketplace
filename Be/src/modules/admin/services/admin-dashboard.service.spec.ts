import type { Response } from 'express';
import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminDashboardExportService } from './admin-dashboard-export.service';

describe('AdminDashboardService', () => {
  let prisma: {
    $queryRaw: jest.Mock;
    booking: {
      count: jest.Mock;
      groupBy: jest.Mock;
      findMany: jest.Mock;
    };
    user: {
      count: jest.Mock;
      findMany: jest.Mock;
    };
    service: {
      count: jest.Mock;
      findMany: jest.Mock;
    };
    serviceCategory: {
      findMany: jest.Mock;
    };
    quotation: {
      aggregate: jest.Mock;
      findMany: jest.Mock;
    };
  };
  let exportService: {
    exportPdf: jest.Mock;
    exportExcel: jest.Mock;
  };
  let service: AdminDashboardService;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-09-30T12:00:00.000Z'));
    prisma = {
      $queryRaw: jest.fn().mockResolvedValue([]),
      booking: {
        count: jest.fn().mockResolvedValue(10),
        groupBy: jest.fn().mockResolvedValue([]),
        findMany: jest.fn().mockResolvedValue([]),
      },
      user: {
        count: jest.fn().mockResolvedValue(5),
        findMany: jest.fn().mockResolvedValue([]),
      },
      service: {
        count: jest.fn().mockResolvedValue(3),
        findMany: jest.fn().mockResolvedValue([]),
      },
      serviceCategory: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      quotation: {
        aggregate: jest.fn().mockResolvedValue({
          _sum: { actualPrice: 1000000 },
          _count: { id: 2 },
        }),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    exportService = {
      exportPdf: jest.fn().mockResolvedValue(undefined),
      exportExcel: jest.fn().mockResolvedValue(undefined),
    };

    service = new AdminDashboardService(
      prisma as unknown as PrismaService,
      exportService as unknown as AdminDashboardExportService,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('defaults dashboard queries to the last 30 days', async () => {
    await service.getDashboardStats({});

    const where = prisma.booking.count.mock.calls[0][0].where;
    expect(where.createdAt.gte).toEqual(new Date('2026-08-31T12:00:00.000Z'));
    expect(where.createdAt.lte).toEqual(new Date('2026-09-30T12:00:00.000Z'));
  });

  it('fills the missing date edge while preserving the supplied edge', async () => {
    await service.getDashboardStats({ from: '2026-01-10' });
    const fromOnlyWhere = prisma.booking.count.mock.calls[0][0].where;
    expect(fromOnlyWhere.createdAt.gte).toEqual(
      new Date('2026-01-10T00:00:00.000Z'),
    );
    expect(fromOnlyWhere.createdAt.lte).toEqual(
      new Date('2026-09-30T12:00:00.000Z'),
    );

    prisma.booking.count.mockClear();
    await service.getDashboardStats({ to: '2026-02-15' });
    const toOnlyWhere = prisma.booking.count.mock.calls[0][0].where;
    expect(toOnlyWhere.createdAt.gte).toEqual(
      new Date('2026-01-16T16:59:59.999Z'),
    );
    expect(toOnlyWhere.createdAt.lte).toEqual(
      new Date('2026-02-15T16:59:59.999Z'),
    );
  });

  it.each([
    [
      { from: '2024-01-01', to: '2025-01-02' },
      'date range cannot exceed 365 days',
    ],
    [
      { from: '2026-02-01', to: '2026-01-01' },
      'from must be before or equal to to',
    ],
    [{ from: 'not-a-date' }, 'from is invalid'],
  ])('rejects invalid dashboard date filters', async (filters, message) => {
    await expect(service.getDashboardStats(filters)).rejects.toThrow(
      new BadRequestException(message),
    );
  });

  it('delegates exportDashboardPdf to AdminDashboardExportService', async () => {
    const mockRes = {} as Response;
    const filters = { groupBy: 'month' as const };

    await service.exportDashboardPdf(mockRes, filters);

    expect(exportService.exportPdf).toHaveBeenCalledWith(
      mockRes,
      expect.objectContaining({ totalBookings: 10 }),
      expect.objectContaining({ revenueData: expect.any(Array) }),
      expect.any(Array),
      expect.objectContaining({
        groupBy: 'month',
        from: expect.any(String),
        to: expect.any(String),
      }),
    );
  });

  it('delegates exportDashboardExcel to AdminDashboardExportService', async () => {
    const mockRes = {} as Response;
    const filters = { groupBy: 'day' as const };

    await service.exportDashboardExcel(mockRes, filters);

    expect(exportService.exportExcel).toHaveBeenCalledWith(
      mockRes,
      expect.objectContaining({ totalBookings: 10 }),
      expect.objectContaining({ revenueData: expect.any(Array) }),
      expect.any(Array),
      expect.objectContaining({
        groupBy: 'day',
        from: expect.any(String),
        to: expect.any(String),
      }),
    );
  });

  it('uses database aggregation without loading historical rows into Node', async () => {
    await service.getDashboardStats({ groupBy: 'month' });
    await service.getDashboardChartData({ groupBy: 'month' });

    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(prisma.quotation.findMany).not.toHaveBeenCalled();
    expect(prisma.booking.findMany).not.toHaveBeenCalled();
  });
});
