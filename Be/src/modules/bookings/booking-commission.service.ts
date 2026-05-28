import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BookingCommissionService {
  private readonly logger = new Logger(BookingCommissionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getCurrentCommissionRate() {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key: 'commission_rate' },
    });

    if (setting?.value) {
      try {
        const parsed = JSON.parse(setting.value) as { rate?: unknown };
        const rate = Number(parsed.rate);
        if (Number.isFinite(rate) && rate >= 0) return rate;
      } catch {
        this.logger.warn('Invalid commission_rate system setting JSON');
      }
    }

    const commissionConfig = await this.prisma.commissionConfig.findFirst({
      orderBy: { effectiveFrom: 'desc' },
    });
    if (commissionConfig) return Number(commissionConfig.rate);

    return 8.5;
  }

  async deductCommission(
    bookingId: number,
    txClient?: Prisma.TransactionClient,
  ) {
    const tx = txClient || this.prisma;

    const quotation = await tx.quotation.findUnique({
      where: { bookingId },
    });
    if (!quotation) return;

    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) return;

    const fee =
      (Number(quotation.actualPrice) *
        Number(quotation.commissionRateSnapshot)) /
      100;

    const executeDeduction = async (dbTx: Prisma.TransactionClient) => {
      const wallet = await dbTx.providerWallet.update({
        where: { providerId: booking.providerId },
        data: { balance: { decrement: fee } },
      });

      await dbTx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'COMMISSION',
          amount: -fee,
          bookingId,
          status: 'SUCCESS',
        },
      });

      if (Number(wallet.balance) < 0 && !wallet.isRestricted) {
        await dbTx.providerWallet.update({
          where: { id: wallet.id },
          data: { isRestricted: true },
        });
      }
    };

    if (txClient) {
      await executeDeduction(txClient);
    } else {
      await this.prisma.$transaction(executeDeduction);
    }
  }
}
