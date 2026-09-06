import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletLedgerService } from '../provider-wallets/wallet-ledger.service';

@Injectable()
export class BookingCommissionService {
  private readonly logger = new Logger(BookingCommissionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: WalletLedgerService,
  ) {}

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
    actorId: number,
    txClient?: Prisma.TransactionClient,
  ) {
    const tx = txClient || this.prisma;

    const quotations = await tx.quotation.findMany({
      where: { bookingId, status: 'ACCEPTED' },
    });
    if (quotations.length === 0) return;

    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) return;

    const fee = quotations.reduce(
      (sum, q) =>
        sum + (Number(q.actualPrice) * Number(q.commissionRateSnapshot)) / 100,
      0,
    );

    const executeDeduction = async (dbTx: Prisma.TransactionClient) => {
      const wallet = await dbTx.providerWallet.findUnique({
        where: { providerId: booking.providerId },
      });
      if (!wallet) return;

      await this.ledger.debitWallet(dbTx, {
        walletId: wallet.id,
        amount: fee,
        type: 'COMMISSION',
        bookingId,
        actorId,
        actionName: 'COMMISSION_DEDUCTION',
        description: `Trừ ${fee.toLocaleString('vi-VN')}₫ hoa hồng cho đơn hàng #${booking.bookingCode}`,
      });
    };

    if (txClient) {
      await executeDeduction(txClient);
    } else {
      await this.prisma.$transaction(executeDeduction);
    }
  }
}
