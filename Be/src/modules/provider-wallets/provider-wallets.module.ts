import { Module } from '@nestjs/common';
import { ProviderWalletsService } from './provider-wallets.service';
import { ProviderWalletsController } from './provider-wallets.controller';
import { VnpayService } from './vnpay.service';
import { VnpayReconciliationCron } from './cron/vnpay-reconciliation.cron';
import { isCronEnabled } from '../../config/runtime.config';

@Module({
  controllers: [ProviderWalletsController],
  providers: [
    ProviderWalletsService,
    VnpayService,
    ...(isCronEnabled() ? [VnpayReconciliationCron] : []),
  ],
  exports: [ProviderWalletsService],
})
export class ProviderWalletsModule {}
