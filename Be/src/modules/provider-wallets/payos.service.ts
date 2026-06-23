import { Injectable, Logger, BadRequestException, OnModuleInit } from '@nestjs/common';
import { PayOS } from '@payos/node';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletSharedService } from './wallet-shared.service';

@Injectable()
export class PayosService implements OnModuleInit {
  private readonly logger = new Logger(PayosService.name);
  private payos: PayOS | null = null;
  private readonly isEnabled: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletShared: WalletSharedService,
  ) {
    this.isEnabled = Boolean(
      process.env.PAYOS_CLIENT_ID &&
      process.env.PAYOS_API_KEY &&
      process.env.PAYOS_CHECKSUM_KEY
    );
  }

  onModuleInit() {
    if (this.isEnabled) {
      this.payos = new PayOS(
        process.env.PAYOS_CLIENT_ID!,
        process.env.PAYOS_API_KEY!,
        process.env.PAYOS_CHECKSUM_KEY!
      );
      this.logger.log('PayOS Client initialized');
    } else {
      this.logger.warn('PayOS config is missing. PayOS payments will be disabled.');
    }
  }

  async createDepositRequest(providerId: number, amount: number) {
    if (!this.isEnabled || !this.payos) {
      throw new BadRequestException('PayOS is not configured on this server');
    }

    if (amount < 2000) {
      throw new BadRequestException('PAYOS_MIN_AMOUNT_2000');
    }

    const wallet = await this.walletShared.getOrCreateWallet(this.prisma, providerId);
    
    // PayOS requires a numeric orderCode (max 53 bit integer)
    // We generate a relatively unique number using timestamp and random digits
    const orderCode = Number(String(Date.now()).slice(-9) + Math.floor(100 + Math.random() * 900));

    // Save transaction
    const txn = await this.prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'DEPOSIT',
        amount,
        status: 'PENDING',
        vnpayTxnRef: String(orderCode), // store orderCode here as a string
        idempotencyKey: `payos_dep_${orderCode}_${Date.now()}`,
      },
    });

    const returnUrl = process.env.FRONTEND_URL
      ? `${process.env.FRONTEND_URL.replace(/\/$/, '')}/payment/return?code=00` // simulating success param
      : 'https://service-marketplace-prod.onrender.com/payment/return';

    const cancelUrl = process.env.FRONTEND_URL
      ? `${process.env.FRONTEND_URL.replace(/\/$/, '')}/payment/return?code=01`
      : 'https://service-marketplace-prod.onrender.com/payment/return';

    const body = {
      orderCode,
      amount,
      description: `Nap tien vi ID ${wallet.id}`,
      returnUrl,
      cancelUrl,
    };

    try {
      const paymentLinkRes = await this.payos.createPaymentLink(body);
      return {
        checkoutUrl: paymentLinkRes.checkoutUrl,
        qrCode: paymentLinkRes.qrCode,
        orderCode: paymentLinkRes.orderCode,
        txnId: txn.id,
      };
    } catch (error: any) {
      this.logger.error('Error creating PayOS payment link', error);
      throw new BadRequestException('Failed to create PayOS payment link');
    }
  }

  async verifyWebhook(webhookBody: any) {
    if (!this.isEnabled || !this.payos) {
      throw new BadRequestException('PayOS is not configured');
    }

    try {
      const data = this.payos.verifyPaymentWebhookData(webhookBody);
      
      if (data.code === '00' && data.data) {
        const orderCode = data.data.orderCode;
        const amount = data.data.amount;
        
        await this.handleSuccessPayment(String(orderCode), amount);
      }
      return { success: true };
    } catch (e: any) {
      this.logger.error('PayOS Webhook verification failed', e);
      throw new BadRequestException('Invalid webhook signature');
    }
  }

  private async handleSuccessPayment(orderCodeStr: string, amount: number) {
    const pendingTxn = await this.prisma.walletTransaction.findFirst({
      where: { vnpayTxnRef: orderCodeStr, status: 'PENDING', type: 'DEPOSIT' },
      include: { wallet: true },
    });

    if (!pendingTxn) {
      this.logger.warn(`No pending PayOS deposit found for orderCode: ${orderCodeStr}`);
      return;
    }

    if (Number(pendingTxn.amount) !== amount) {
      this.logger.error(`Amount mismatch for ${orderCodeStr}. Expected ${pendingTxn.amount}, got ${amount}`);
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      const locked = await tx.walletTransaction.findFirst({
        where: { id: pendingTxn.id, status: 'PENDING' },
      });
      if (!locked) return;

      await tx.walletTransaction.update({
        where: { id: pendingTxn.id },
        data: {
          status: 'SUCCESS',
          processedAt: new Date(),
        },
      });

      const updatedWallet = await tx.providerWallet.update({
        where: { id: pendingTxn.walletId },
        data: { balance: { increment: amount } },
      });

      if (Number(updatedWallet.balance) >= 0 && updatedWallet.isRestricted) {
        await tx.providerWallet.update({
          where: { id: updatedWallet.id },
          data: { isRestricted: false },
        });
      }

      await tx.notification.create({
        data: {
          userId: updatedWallet.providerId,
          type: 'DEPOSIT_SUCCESS',
          title: 'Nạp tiền tự động thành công (VietQR)',
          content: `Bạn đã nạp thành công ${amount.toLocaleString('vi-VN')}₫ vào ví thông qua mã VietQR`,
          referenceId: pendingTxn.id,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: updatedWallet.providerId,
          action: 'PAYOS_DEPOSIT_SUCCESS',
          targetType: 'WALLET',
          targetId: updatedWallet.id,
          description: `PayOS deposit success: ${amount}`,
        },
      });
    });
    
    this.logger.log(`Successfully processed PayOS deposit for orderCode: ${orderCodeStr}`);
  }
}
