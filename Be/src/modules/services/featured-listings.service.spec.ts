import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { FeaturedListingStatus, ServiceStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../shared/redis/redis.service';
import { FeaturedListingsService } from './featured-listings.service';

type FeaturedPrismaMock = {
  service: { findFirst: jest.Mock };
  featuredListing: {
    findFirst: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
    findUnique: jest.Mock;
  };
  providerWallet: { findUnique: jest.Mock };
  systemSetting: { findUnique: jest.Mock };
  $transaction: jest.Mock;
};

type FeaturedTransactionMock = {
  providerWallet: { update: jest.Mock };
  walletTransaction: { create: jest.Mock };
  featuredListing: { create: jest.Mock; update: jest.Mock };
  auditLog: { create: jest.Mock };
  systemSetting: { upsert: jest.Mock };
};

describe('FeaturedListingsService', () => {
  let service: FeaturedListingsService;
  let prisma: FeaturedPrismaMock;
  let tx: FeaturedTransactionMock;
  let redis: { get: jest.Mock; set: jest.Mock; del: jest.Mock };

  beforeEach(() => {
    tx = {
      providerWallet: { update: jest.fn() },
      walletTransaction: { create: jest.fn().mockResolvedValue({ id: 55 }) },
      featuredListing: {
        create: jest.fn().mockResolvedValue({ id: 1, serviceId: 99 }),
        update: jest.fn().mockResolvedValue({
          id: 1,
          status: FeaturedListingStatus.CANCELLED,
        }),
      },
      auditLog: { create: jest.fn() },
      systemSetting: {
        upsert: jest.fn().mockResolvedValue({
          id: 7,
          key: 'featured_daily_rate',
          value: '75000',
        }),
      },
    };

    prisma = {
      service: {
        findFirst: jest.fn().mockResolvedValue({
          id: 99,
          providerId: 10,
          status: ServiceStatus.ACTIVE,
        }),
      },
      featuredListing: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn(),
      },
      providerWallet: {
        findUnique: jest.fn().mockResolvedValue({
          id: 1,
          providerId: 10,
          balance: 500000,
          isRestricted: false,
        }),
      },
      systemSetting: {
        findUnique: jest.fn().mockResolvedValue({
          value: '50000',
        }),
      },
      $transaction: jest.fn(
        async (callback: (tx: FeaturedTransactionMock) => Promise<unknown>) =>
          callback(tx),
      ),
    };
    redis = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    service = new FeaturedListingsService(
      prisma as unknown as PrismaService,
      redis as unknown as RedisService,
    );
  });

  it('rejects invalid package days', async () => {
    await expect(
      service.purchaseFeaturedListing(10, 99, 2),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects purchase when provider wallet is restricted', async () => {
    prisma.providerWallet.findUnique.mockResolvedValue({
      id: 1,
      providerId: 10,
      balance: 500000,
      isRestricted: true,
    });

    await expect(
      service.purchaseFeaturedListing(10, 99, 1),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('creates ledger and featured listing when purchase succeeds', async () => {
    const result = await service.purchaseFeaturedListing(10, 99, 3);

    expect(tx.providerWallet.update).toHaveBeenCalledWith({
      where: { providerId: 10 },
      data: { balance: { decrement: 150000 } },
    });
    expect(tx.walletTransaction.create).toHaveBeenCalledWith({
      data: {
        walletId: 1,
        type: 'FEATURED_FEE',
        amount: -150000,
        status: 'SUCCESS',
      },
    });
    expect(tx.featuredListing.create).toHaveBeenCalledTimes(1);
    expect(result.message).toContain('3 ngày');
  });

  it('rejects admin cancel when featured listing is missing', async () => {
    prisma.featuredListing.findUnique.mockResolvedValue(null);

    await expect(
      service.adminCancelFeaturedListing(1, 999),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates featured daily rate through system setting', async () => {
    const result = await service.updateFeaturedDailyRate(1, 75000);

    expect(tx.systemSetting.upsert).toHaveBeenCalledWith({
      where: { key: 'featured_daily_rate' },
      create: { key: 'featured_daily_rate', value: '75000' },
      update: { value: '75000' },
    });
    expect(result.data.dailyRate).toBe(75000);
  });
});
