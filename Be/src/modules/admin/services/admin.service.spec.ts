import { NotFoundException } from '@nestjs/common';
import { ErrorCodes } from '../../../common/errors/error-codes';
import { PrismaService } from '../../../prisma/prisma.service';
import { AdminService } from './admin.service';
import { KycService } from '../../users/kyc.service';
import { BookingLifecycleService } from '../../bookings/booking-lifecycle.service';
import { BookingDisputeService } from '../../bookings/booking-dispute.service';

describe('AdminService', () => {
  let prisma: {
    kycProfile: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
    };
    booking: {
      findMany: jest.Mock;
      count: jest.Mock;
    };
    dispute: {
      findMany: jest.Mock;
      count: jest.Mock;
    };
    user: {
      findMany: jest.Mock;
      count: jest.Mock;
    };
    systemSetting: {
      findFirst: jest.Mock;
      upsert: jest.Mock;
    };
    commissionConfig: {
      create: jest.Mock;
    };
    auditLog: {
      create: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let service: AdminService;

  beforeEach(() => {
    prisma = {
      kycProfile: {
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      booking: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      dispute: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      user: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      systemSetting: {
        findFirst: jest.fn(),
        upsert: jest.fn(),
      },
      commissionConfig: {
        create: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    service = new AdminService(
      prisma as unknown as PrismaService,
      {} as KycService,
      {} as BookingLifecycleService,
      {} as BookingDisputeService,
    );
  });

  describe('getKycRequestById', () => {
    it('throws NotFoundException with standardized code when KYC request not found', async () => {
      prisma.kycProfile.findUnique.mockResolvedValue(null);

      try {
        await service.getKycRequestById(999);
        fail('Expected NotFoundException');
      } catch (err) {
        expect(err).toBeInstanceOf(NotFoundException);
        const response = (err as NotFoundException).getResponse() as {
          code: string;
          message: string;
        };
        expect(response.code).toBe(ErrorCodes.NOT_FOUND);
        expect(response.message).toBe('Yêu cầu KYC không tồn tại');
      }
    });

    it('returns KYC request when found', async () => {
      const mockKyc = {
        id: 1,
        providerId: 10,
        status: 'PENDING',
        provider: { id: 10, fullName: 'Test Provider' },
      };
      prisma.kycProfile.findUnique.mockResolvedValue(mockKyc);

      const result = await service.getKycRequestById(1);
      expect(result).toEqual({ data: mockKyc });
    });
  });

  describe('pagination contracts', () => {
    it('returns standardized pagination meta for getKycRequests', async () => {
      prisma.kycProfile.findMany.mockResolvedValue([{ id: 1 }]);
      prisma.kycProfile.count.mockResolvedValue(25);

      const result = await service.getKycRequests(undefined, 2, 10);
      expect(result.meta).toEqual({
        total: 25,
        page: 2,
        limit: 10,
        totalPages: 3,
      });
    });

    it('returns standardized pagination meta for getBookings', async () => {
      prisma.booking.findMany.mockResolvedValue([{ id: 1 }]);
      prisma.booking.count.mockResolvedValue(45);

      const result = await service.getBookings(undefined, undefined, 1, 20);
      expect(result.meta).toEqual({
        total: 45,
        page: 1,
        limit: 20,
        totalPages: 3,
      });
    });

    it('returns standardized pagination meta for getDisputes', async () => {
      prisma.dispute.findMany.mockResolvedValue([{ id: 1 }]);
      prisma.dispute.count.mockResolvedValue(5);

      const result = await service.getDisputes(undefined, 1, 10);
      expect(result.meta).toEqual({
        total: 5,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('returns standardized pagination meta for getUsers', async () => {
      prisma.user.findMany.mockResolvedValue([{ id: 1 }]);
      prisma.user.count.mockResolvedValue(100);

      const result = await service.getUsers(3, 20);
      expect(result.meta).toEqual({
        total: 100,
        page: 3,
        limit: 20,
        totalPages: 5,
      });
    });
  });

  describe('updateCommissionSettings', () => {
    it('creates audit log with action UPDATE_COMMISSION_SETTINGS and ipAddress', async () => {
      const body = { rate: 12, minAmount: 20000, maxAmount: 1000000 };
      await service.updateCommissionSettings(1, body, '192.168.1.100');

      expect(prisma.systemSetting.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { key: 'commission_rate' },
          update: { value: JSON.stringify(body) },
        }),
      );
      expect(prisma.commissionConfig.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            rate: 12,
            configuredBy: 1,
          }),
        }),
      );
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          actorId: 1,
          action: 'UPDATE_COMMISSION_SETTINGS',
          targetType: 'SYSTEM_SETTING',
          targetId: 0,
          description:
            'Cập nhật cấu hình hoa hồng: 12%, min=20000, max=1000000',
          ipAddress: '192.168.1.100',
        },
      });
    });
  });
});
