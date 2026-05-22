import { Module } from '@nestjs/common';
import { ProviderWalletsService } from './provider-wallets.service';
import {
  AdminWalletDepositsController,
  AdminWalletWithdrawalsController,
  ProviderWalletsController,
} from './provider-wallets.controller';
import { VnpayService } from './vnpay.service';
import { VnpayReconciliationCron } from './cron/vnpay-reconciliation.cron';
import { isCronEnabled } from '../../config/runtime.config';

@Module({
  controllers: [
    ProviderWalletsController,
    AdminWalletDepositsController,
    AdminWalletWithdrawalsController,
  ],
  providers: [
    ProviderWalletsService,
    VnpayService,
    ...(isCronEnabled() ? [VnpayReconciliationCron] : []),
  ],
  exports: [ProviderWalletsService],
})
export class ProviderWalletsModule {}
