import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../../shared/cloudinary/cloudinary.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WalletLedgerService } from '../provider-wallets/wallet-ledger.service';
import { ServiceCommandService } from './service-command.service';
import { ServiceSharedService } from './service-shared.service';

type ServiceCommandPrismaMock = {
  service: {
    update: jest.Mock;
    findUnique: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
  };
  providerWallet: {
    findUnique: jest.Mock;
  };
  systemSetting: {
    findUnique: jest.Mock;
  };
  commissionConfig: {
    findFirst: jest.Mock;
  };
  $transaction: jest.Mock;
};

type ServiceSharedMock = {
  checkActiveUser: jest.Mock;
  checkOwnership: jest.Mock;
  notifyAdmins: jest.Mock;
  isServiceStatus: jest.Mock;
};

describe('ServiceCommandService ownership', () => {
  let service: ServiceCommandService;
  let prisma: ServiceCommandPrismaMock;
  let shared: ServiceSharedMock;

  beforeEach(() => {
    prisma = {
      service: {
        update: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
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
      $transaction: jest.fn(),
    };
    shared = {
      checkActiveUser: jest.fn().mockResolvedValue({ id: 1 }),
      checkOwnership: jest
        .fn()
        .mockRejectedValue(new NotFoundException('Dịch vụ không tồn tại')),
      notifyAdmins: jest.fn(),
      isServiceStatus: jest.fn().mockReturnValue(false),
    };

    service = new ServiceCommandService(
      prisma as unknown as PrismaService,
      {} as CloudinaryService,
      shared as unknown as ServiceSharedService,
      { syncWalletRestriction: jest.fn() } as unknown as WalletLedgerService,
      { emit: jest.fn() } as unknown as EventEmitter2,
    );
  });

  it('returns a bounded paginated provider service projection', async () => {
    prisma.service.count.mockResolvedValue(51);
    prisma.service.findMany.mockResolvedValue([{ id: 1 }]);

    const result = await service.getMyServices(1, undefined, 2, 50);

    expect(prisma.service.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 50, take: 50 }),
    );
    expect(result.meta).toEqual({
      page: 2,
      limit: 50,
      total: 51,
      totalPages: 2,
    });
  });

  it.each([
    ['update', () => service.update(1, 99, { name: 'Blocked' })],
    ['submit', () => service.submit(1, 99)],
    ['hide', () => service.hide(1, 99)],
    ['show', () => service.show(1, 99)],
    ['deleteByProvider', () => service.deleteByProvider(1, 99)],
  ])('rejects %s when provider does not own the service', async (_, action) => {
    await expect(action()).rejects.toBeInstanceOf(NotFoundException);

    expect(shared.checkOwnership).toHaveBeenCalledWith(99, 1);
    expect(prisma.service.update).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(shared.notifyAdmins).not.toHaveBeenCalled();
  });

  describe('show service deposit concurrency', () => {
    it('locks the provider wallet before reading deposit inputs and updating service', async () => {
      const serviceRecord = {
        id: 99,
        providerId: 1,
        status: 'HIDDEN',
        isDeleted: false,
        referencePrice: 1000,
      };
      const tx = {
        $executeRaw: jest.fn().mockResolvedValue(undefined),
        service: {
          findMany: jest.fn().mockResolvedValue([]),
          update: jest.fn().mockResolvedValue({
            ...serviceRecord,
            status: 'ACTIVE',
          }),
        },
        providerWallet: {
          findUnique: jest.fn().mockResolvedValue({ balance: 1000 }),
        },
        systemSetting: { findUnique: jest.fn().mockResolvedValue(null) },
        commissionConfig: { findFirst: jest.fn().mockResolvedValue(null) },
      };
      prisma.$transaction.mockImplementation(
        (callback: (value: typeof tx) => unknown) => callback(tx),
      );
      shared.checkOwnership.mockResolvedValue(serviceRecord);

      await service.show(1, 99);

      const lockOrder = tx.$executeRaw.mock.invocationCallOrder[0];
      const walletOrder =
        tx.providerWallet.findUnique.mock.invocationCallOrder[0];
      const updateOrder = tx.service.update.mock.invocationCallOrder[0];
      expect(lockOrder).toBeLessThan(walletOrder);
      expect(lockOrder).toBeLessThan(updateOrder);
      expect(tx.$executeRaw).toHaveBeenCalledTimes(1);
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.service.update).not.toHaveBeenCalled();
    });

    it('rejects activation inside the transaction when the locked balance is insufficient', async () => {
      const serviceRecord = {
        id: 99,
        providerId: 1,
        status: 'HIDDEN',
        isDeleted: false,
        referencePrice: 1000,
      };
      const tx = {
        $executeRaw: jest.fn().mockResolvedValue(undefined),
        service: {
          findMany: jest.fn().mockResolvedValue([]),
          update: jest.fn(),
        },
        providerWallet: {
          findUnique: jest.fn().mockResolvedValue({ balance: 0 }),
        },
        systemSetting: { findUnique: jest.fn().mockResolvedValue(null) },
        commissionConfig: { findFirst: jest.fn().mockResolvedValue(null) },
      };
      prisma.$transaction.mockImplementation(
        (callback: (value: typeof tx) => unknown) => callback(tx),
      );
      shared.checkOwnership.mockResolvedValue(serviceRecord);

      await expect(service.show(1, 99)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(tx.service.update).not.toHaveBeenCalled();
    });
  });
});
