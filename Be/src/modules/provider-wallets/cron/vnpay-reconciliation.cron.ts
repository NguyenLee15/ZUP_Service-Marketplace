import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class VnpayReconciliationCron {
  private readonly logger = new Logger(VnpayReconciliationCron.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCron() {
    this.logger.log('Bắt đầu chạy Cronjob đối soát VNPay...');

    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    // Tìm các giao dịch bị kẹt PENDING quá 15 phút
    const stuckTxns = await this.prisma.walletTransaction.findMany({
      where: {
        type: 'DEPOSIT',
        status: 'PENDING',
        createdAt: {
          lte: fifteenMinutesAgo,
        },
      },
    });

    if (stuckTxns.length === 0) {
      this.logger.log('Không có giao dịch PENDING nào cần đối soát.');
      return;
    }

    this.logger.log(`Tìm thấy ${stuckTxns.length} giao dịch cần đối soát.`);

    for (const txn of stuckTxns) {
      // TODO: Tích hợp API query thực tế của VNPay (vnp_Command=querydr)
      // Hiện tại: Chuyển các giao dịch kẹt quá hạn thành FAILED
      await this.prisma.walletTransaction.update({
        where: { id: txn.id },
        data: { status: 'FAILED' },
      });
      this.logger.log(
        `Đã chuyển giao dịch ${txn.vnpayTxnRef} thành FAILED do quá hạn.`,
      );
    }

    this.logger.log('Hoàn tất đối soát VNPay.');
  }
}
