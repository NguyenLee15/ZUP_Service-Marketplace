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

    return transaction;
  }
}
