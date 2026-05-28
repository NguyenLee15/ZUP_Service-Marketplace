import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { VnpayService } from './vnpay.service';

@Injectable()
export class PaymentCallbackService {
  private readonly logger = new Logger(PaymentCallbackService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vnpayService: VnpayService,
  ) {}

  async handleVnpayIpn(query: Record<string, string>) {
    const result = this.vnpayService.verifyIpn(query);

    if (!result.isValid) {
      this.logger.warn(`Invalid IPN hash: ${result.txnRef}`);
      return { RspCode: '97', Message: 'Invalid Checksum' };
    }

    const existingSuccess = await this.prisma.walletTransaction.findFirst({
      where: { vnpayTxnRef: result.txnRef, status: 'SUCCESS' },
    });
    if (existingSuccess) {
      return { RspCode: '00', Message: 'Already processed' };
    }

    const pending = await this.prisma.walletTransaction.findFirst({
      where: { vnpayTxnRef: result.txnRef, status: 'PENDING' },
    });
    if (!pending) {
      return { RspCode: '01', Message: 'Order not found' };
    }

    if (Number(pending.amount) !== result.amount) {
      await this.prisma.walletTransaction.update({
        where: { id: pending.id },
        data: {
          status: 'FAILED',
          processedAt: new Date(),
          failureReason: `Amount mismatch. Expected ${Number(pending.amount)}, received ${result.amount}`,
        },
      });
      return { RspCode: '04', Message: 'Invalid amount' };
    }

    if (result.responseCode !== '00') {
      await this.prisma.walletTransaction.update({
        where: { id: pending.id },
        data: {
          status: 'FAILED',
          processedAt: new Date(),
          failureReason: `VNPay response code ${result.responseCode}`,
        },
      });
      return { RspCode: '00', Message: 'Confirm Success' };
    }

    await this.prisma.$transaction(async (tx) => {
      const locked = await tx.walletTransaction.findFirst({
        where: { id: pending.id, status: 'PENDING' },
      });
      if (!locked) return;

      const updatedTxn = await tx.walletTransaction.update({
        where: { id: locked.id },
        data: {
          status: 'SUCCESS',
          processedAt: new Date(),
        },
      });

      const wallet = await tx.providerWallet.update({
        where: { id: updatedTxn.walletId },
        data: { balance: { increment: result.amount } },
      });

      if (Number(wallet.balance) >= 0 && wallet.isRestricted) {
        await tx.providerWallet.update({
          where: { id: wallet.id },
          data: { isRestricted: false },
        });
      }

      await tx.notification.create({
        data: {
          userId: wallet.providerId,
          type: 'DEPOSIT_SUCCESS',
          title: 'Nạp tiền thành công',
          content: `Bạn đã nạp thành công ${result.amount.toLocaleString('vi-VN')}₫ vào ví`,
          referenceId: updatedTxn.id,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: wallet.providerId,
          action: 'VNPAY_DEPOSIT_SUCCESS',
          targetType: 'WALLET',
          targetId: updatedTxn.id,
          description: `Nạp thành công ${result.amount.toLocaleString('vi-VN')}₫ vào ví. Ref: ${result.txnRef}`,
          ipAddress: 'System',
        },
      });
    });

    this.logger.log(
      `IPN processed: ${result.txnRef}, amount: ${result.amount}`,
    );
    return { RspCode: '00', Message: 'Confirm Success' };
  }
}
