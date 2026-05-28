import { Injectable } from '@nestjs/common';
import { DepositService } from './deposit.service';
import { PaymentCallbackService } from './payment-callback.service';
import { WalletAccountService } from './wallet-account.service';
import {
  CreateWithdrawalRequestInput,
  WithdrawalService,
} from './withdrawal.service';

@Injectable()
export class ProviderWalletsService {
  constructor(
    private readonly walletAccountService: WalletAccountService,
    private readonly depositService: DepositService,
    private readonly withdrawalService: WithdrawalService,
    private readonly paymentCallbackService: PaymentCallbackService,
  ) {}

  getBalance(providerId: number) {
    return this.walletAccountService.getBalance(providerId);
  }

  getHistory(providerId: number, type?: string, page = 1, limit = 20) {
    return this.walletAccountService.getHistory(providerId, type, page, limit);
  }

  createDepositRequest(providerId: number, amount: number, ipAddress: string) {
    return this.depositService.createDepositRequest(
      providerId,
      amount,
      ipAddress,
    );
  }

  createManualDepositRequest(
    providerId: number,
    amount: number,
    transferCode?: string,
    receiptUrl?: string,
  ) {
    return this.depositService.createManualDepositRequest(
      providerId,
      amount,
      transferCode,
      receiptUrl,
    );
  }

  getManualDepositRequests(providerId: number, page = 1, limit = 20) {
    return this.depositService.getManualDepositRequests(
      providerId,
      page,
      limit,
    );
  }

  adminListManualDepositRequests(status?: string, page = 1, limit = 20) {
    return this.depositService.adminListManualDepositRequests(
      status,
      page,
      limit,
    );
  }

  adminApproveManualDeposit(adminId: number, id: number, note?: string) {
    return this.depositService.adminApproveManualDeposit(adminId, id, note);
  }

  adminRejectManualDeposit(adminId: number, id: number, note?: string) {
    return this.depositService.adminRejectManualDeposit(adminId, id, note);
  }

  createWithdrawalRequest(
    providerId: number,
    data: CreateWithdrawalRequestInput,
  ) {
    return this.withdrawalService.createWithdrawalRequest(providerId, data);
  }

  getWithdrawalRequests(providerId: number, page = 1, limit = 20) {
    return this.withdrawalService.getWithdrawalRequests(
      providerId,
      page,
      limit,
    );
  }

  adminListWithdrawalRequests(status?: string, page = 1, limit = 20) {
    return this.withdrawalService.adminListWithdrawalRequests(
      status,
      page,
      limit,
    );
  }

  adminApproveWithdrawal(adminId: number, id: number, note?: string) {
    return this.withdrawalService.adminApproveWithdrawal(adminId, id, note);
  }

  adminRejectWithdrawal(adminId: number, id: number, note?: string) {
    return this.withdrawalService.adminRejectWithdrawal(adminId, id, note);
  }

  handleIpn(query: Record<string, string>) {
    return this.paymentCallbackService.handleVnpayIpn(query);
  }
}
