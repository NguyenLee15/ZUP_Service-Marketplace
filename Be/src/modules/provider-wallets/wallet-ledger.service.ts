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

    if (Number(wallet.balance) >= 0 && wallet.isRestricted) {
      await tx.providerWallet.update({
        where: { id: wallet.id },
        data: { isRestricted: false },
      });
    }

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

    if (Number(wallet.balance) < 0 && !wallet.isRestricted) {
      await tx.providerWallet.update({
        where: { id: wallet.id },
        data: { isRestricted: true },
      });
    }

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
}
