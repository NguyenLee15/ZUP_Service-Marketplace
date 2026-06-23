import { Module } from '@nestjs/common';
import {
  AdminWalletDepositsController,
  AdminWalletWithdrawalsController,
  ProviderWalletsController,
} from './provider-wallets.controller';
import { VnpayService } from './vnpay.service';
import { VnpayReconciliationCron } from './cron/vnpay-reconciliation.cron';
import { isCronEnabled } from '../../config/runtime.config';
import { WalletLedgerService } from './wallet-ledger.service';
import { PaymentCallbackService } from './payment-callback.service';
import { WalletAccountService } from './wallet-account.service';
import { DepositService } from './deposit.service';
import { WithdrawalService } from './withdrawal.service';
import { WalletSharedService } from './wallet-shared.service';
import { PayosService } from './payos.service';

@Module({
  controllers: [
    ProviderWalletsController,
    AdminWalletDepositsController,
    AdminWalletWithdrawalsController,
  ],
  providers: [
    WalletAccountService,
    DepositService,
    WithdrawalService,
    WalletSharedService,
    VnpayService,
    PayosService,
    WalletLedgerService,
    PaymentCallbackService,
    ...(isCronEnabled() ? [VnpayReconciliationCron] : []),
  ],
  exports: [
    WalletAccountService,
    DepositService,
    WithdrawalService,
    WalletLedgerService,
    PaymentCallbackService,
    PayosService,
  ],
})
export class ProviderWalletsModule {}
