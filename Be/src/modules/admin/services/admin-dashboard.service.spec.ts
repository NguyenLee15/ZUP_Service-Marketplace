import type { Response } from 'express';
import { PrismaService } from '../../../prisma/prisma.service';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminDashboardExportService } from './admin-dashboard-export.service';

describe('AdminDashboardService', () => {
  let prisma: {
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
    prisma = {
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

  it('delegates exportDashboardPdf to AdminDashboardExportService', async () => {
    const mockRes = {} as Response;
    const filters = { groupBy: 'month' as const };

    await service.exportDashboardPdf(mockRes, filters);

    expect(exportService.exportPdf).toHaveBeenCalledWith(
      mockRes,
      expect.objectContaining({ totalBookings: 10 }),
      expect.objectContaining({ revenueData: expect.any(Array) }),
      expect.any(Array),
      filters,
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
      filters,
    );
  });
});
