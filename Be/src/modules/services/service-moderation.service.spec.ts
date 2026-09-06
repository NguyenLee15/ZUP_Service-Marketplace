import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JobsService } from '../../shared/jobs/jobs.service';
import { ServiceSharedService } from './service-shared.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WalletLedgerService } from '../provider-wallets/wallet-ledger.service';
import { ServiceModerationService } from './service-moderation.service';
import { ServiceStatus } from '@prisma/client';

describe('ServiceModerationService', () => {
  let service: ServiceModerationService;
  let prisma: any;
  let jobsService: any;
  let shared: any;
  let eventEmitter: any;
  let ledger: any;

  beforeEach(() => {
    prisma = {
      service: {
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      providerWallet: {
        findUnique: jest.fn(),
      },
      systemSetting: {
        findUnique: jest.fn(),
      },
      commissionConfig: {
        findFirst: jest.fn(),
      },
      user: {
        update: jest.fn(),
      },
      notification: {
        create: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
    };

    jobsService = { enqueue: jest.fn() };
    shared = { isServiceStatus: jest.fn() };
    eventEmitter = { emit: jest.fn() };
    ledger = { syncWalletRestriction: jest.fn() };

    service = new ServiceModerationService(
      prisma,
      jobsService,
      shared,
      eventEmitter,
      ledger,
    );
  });

  describe('reject', () => {
    it('rejects a pending service and writes an audit log', async () => {
      prisma.service.findUnique.mockResolvedValue({
        id: 101,
        name: 'Sửa điều hòa',
        status: ServiceStatus.PENDING,
        providerId: 5,
      });
      prisma.service.update.mockResolvedValue({
        id: 101,
        status: ServiceStatus.REJECTED,
      });

      const result = await service.reject(
        1,
        101,
        'Hình ảnh không rõ ràng',
        '10.0.0.1',
      );

      expect(result.data.status).toBe(ServiceStatus.REJECTED);
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          actorId: 1,
          action: 'REJECT_SERVICE',
          targetType: 'SERVICE',
          targetId: 101,
          description:
            'Từ chối dịch vụ: Sửa điều hòa. Lý do: Hình ảnh không rõ ràng',
          ipAddress: '10.0.0.1',
        },
      });
    });

    it('throws BadRequestException if service is not pending', async () => {
      prisma.service.findUnique.mockResolvedValue({
        id: 101,
        name: 'Sửa điều hòa',
        status: ServiceStatus.ACTIVE,
        providerId: 5,
      });

      await expect(
        service.reject(1, 101, 'Lý do', '10.0.0.1'),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prisma.auditLog.create).not.toHaveBeenCalled();
    });
  });

  describe('hide', () => {
    it('hides active service and records audit log', async () => {
      prisma.service.findUnique.mockResolvedValue({
        id: 102,
        name: 'Vệ sinh máy giặt',
        status: ServiceStatus.ACTIVE,
        providerId: 6,
      });
      prisma.service.update.mockResolvedValue({
        id: 102,
        status: ServiceStatus.HIDDEN,
      });

      await service.hide(1, 102, 'Tạm ngưng hoạt động', '127.0.0.1');

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          actorId: 1,
          action: 'HIDE_SERVICE',
          targetType: 'SERVICE',
          targetId: 102,
          description:
            'Ẩn dịch vụ: Vệ sinh máy giặt. Lý do: Tạm ngưng hoạt động',
          ipAddress: '127.0.0.1',
        },
      });
    });
  });

  describe('show', () => {
    it('unhides hidden service and records audit log', async () => {
      prisma.service.findUnique.mockResolvedValue({
        id: 102,
        name: 'Vệ sinh máy giặt',
        status: ServiceStatus.HIDDEN,
        providerId: 6,
      });
      prisma.service.update.mockResolvedValue({
        id: 102,
        status: ServiceStatus.ACTIVE,
      });

      await service.show(1, 102, '127.0.0.1');

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          actorId: 1,
          action: 'SHOW_SERVICE',
          targetType: 'SERVICE',
          targetId: 102,
          description: 'Mở hiển thị dịch vụ: Vệ sinh máy giặt',
          ipAddress: '127.0.0.1',
        },
      });
    });
  });

  describe('delete', () => {
    it('soft deletes service and records audit log', async () => {
      prisma.service.findUnique.mockResolvedValue({
        id: 103,
        name: 'Sơn tường',
        providerId: 7,
      });
      prisma.service.update.mockResolvedValue({
        id: 103,
        isDeleted: true,
      });

      await service.delete(1, 103, '127.0.0.1');

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          actorId: 1,
          action: 'DELETE_SERVICE',
          targetType: 'SERVICE',
          targetId: 103,
          description: 'Xóa dịch vụ: Sơn tường',
          ipAddress: '127.0.0.1',
        },
      });
    });
  });
});
