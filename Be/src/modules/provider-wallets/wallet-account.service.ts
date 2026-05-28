import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletSharedService } from './wallet-shared.service';

@Injectable()
export class WalletAccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly shared: WalletSharedService,
  ) {}

  async getBalance(providerId: number) {
    const wallet = await this.shared.getWalletOrThrow(providerId);
    return {
      data: {
        balance: wallet.balance,
        isRestricted: wallet.isRestricted,
      },
    };
  }

  async getHistory(providerId: number, type?: string, page = 1, limit = 20) {
    const wallet = await this.shared.getWalletOrThrow(providerId);

    const where: Prisma.WalletTransactionWhereInput = { walletId: wallet.id };
    if (this.shared.isWalletTransactionType(type)) where.type = type;

    const [data, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where,
        include: { booking: { select: { id: true, bookingCode: true } } },
        orderBy: { id: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.walletTransaction.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
