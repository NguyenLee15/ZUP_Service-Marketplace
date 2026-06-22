import { Injectable } from '@nestjs/common';
import { Prisma, WalletTransactionType } from '@prisma/client';

@Injectable()
export class WalletLedgerService {
  async creditWallet(
    tx: Prisma.TransactionClient,
    input: {
      walletId: number;
      amount: number;
      type: WalletTransactionType;
      bookingId?: number | null;
      disputeId?: number | null;
      vnpayTxnRef?: string | null;
      idempotencyKey?: string | null;
      actorId: number;
      actionName: string;
      description?: string;
      ipAddress?: string;
    },
  ) {
    const transaction = await tx.walletTransaction.create({
      data: {
        walletId: input.walletId,
        type: input.type,
        amount: input.amount,
        bookingId: input.bookingId ?? null,
        disputeId: input.disputeId ?? null,
        status: 'SUCCESS',
        vnpayTxnRef: input.vnpayTxnRef ?? null,
        idempotencyKey: input.idempotencyKey ?? null,
        processedAt: new Date(),
      },
    });

    const wallet = await tx.providerWallet.update({
      where: { id: input.walletId },
      data: {
        balance: { increment: input.amount },
      },
    });

    await this.syncWalletRestriction(wallet.providerId, tx);

    await tx.auditLog.create({
      data: {
        actorId: input.actorId,
        action: input.actionName,
        targetType: 'WALLET',
        targetId: transaction.id,
        description: input.description || `Cộng ví ${input.amount.toLocaleString('vi-VN')}₫ (Mã ví: ${input.walletId})`,
        ipAddress: input.ipAddress || 'System',
      },
    });

    return transaction;
  }

  async debitWallet(
    tx: Prisma.TransactionClient,
    input: {
      walletId: number;
      amount: number;
      type: WalletTransactionType;
      bookingId?: number | null;
      disputeId?: number | null;
      idempotencyKey?: string | null;
      actorId: number;
      actionName: string;
      description?: string;
      ipAddress?: string;
    },
  ) {
    const amount = Math.abs(input.amount);
    const transaction = await tx.walletTransaction.create({
      data: {
        walletId: input.walletId,
        type: input.type,
        amount: -amount,
        bookingId: input.bookingId ?? null,
        disputeId: input.disputeId ?? null,
        status: 'SUCCESS',
        idempotencyKey: input.idempotencyKey ?? null,
        processedAt: new Date(),
      },
    });

    const wallet = await tx.providerWallet.update({
      where: { id: input.walletId },
      data: {
        balance: { decrement: amount },
      },
    });

    await this.syncWalletRestriction(wallet.providerId, tx);

    await tx.auditLog.create({
      data: {
        actorId: input.actorId,
        action: input.actionName,
        targetType: 'WALLET',
        targetId: transaction.id,
        description: input.description || `Trừ ví ${amount.toLocaleString('vi-VN')}₫ (Mã ví: ${input.walletId})`,
        ipAddress: input.ipAddress || 'System',
      },
    });

    return transaction;
  }

  async syncWalletRestriction(providerId: number, tx: Prisma.TransactionClient) {
    const wallet = await tx.providerWallet.findUnique({
      where: { providerId },
    });
    if (!wallet) return;

    // Lấy tổng giá tham khảo của các dịch vụ ACTIVE
    const activeServices = await tx.service.findMany({
      where: { providerId, status: 'ACTIVE', isDeleted: false },
      select: { referencePrice: true },
    });

    const sumReferencePrice = activeServices.reduce(
      (sum, s) => sum + Number(s.referencePrice),
      0,
    );

    // Lấy tỉ lệ hoa hồng
    let rate = 8.5;
    const setting = await tx.systemSetting.findUnique({
      where: { key: 'commission_rate' },
    });
    if (setting?.value) {
      try {
        const parsed = JSON.parse(setting.value) as { rate?: unknown };
        if (typeof parsed.rate === 'number') rate = parsed.rate;
      } catch {}
    } else {
      const commissionConfig = await tx.commissionConfig.findFirst({
        orderBy: { effectiveFrom: 'desc' },
      });
      if (commissionConfig) rate = Number(commissionConfig.rate);
    }

    // Mức ký quỹ tối thiểu: (Tổng giá dịch vụ * tỉ lệ hoa hồng)
    // Wallet balance có thể âm, nếu balance nhỏ hơn mức yêu cầu => restrict
    const requiredDeposit = (sumReferencePrice * rate) / 100;
    const isRestricted = Number(wallet.balance) < requiredDeposit;

    if (wallet.isRestricted !== isRestricted) {
      await tx.providerWallet.update({
        where: { id: wallet.id },
        data: { isRestricted },
      });
    }
  }
}
