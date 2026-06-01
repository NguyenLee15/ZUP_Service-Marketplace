import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WalletLedgerService } from './wallet-ledger.service';
import { WalletSharedService } from './wallet-shared.service';
import { DepositService } from './deposit.service';
import { VnpayService } from './vnpay.service';

type MockTransaction = {
  manualDepositRequest: {
    findUnique: jest.Mock;
    updateMany: jest.Mock;
    findUniqueOrThrow: jest.Mock;
  };
  notification: {
    create: jest.Mock;
  };
  auditLog: {
    create: jest.Mock;
  };
};

describe('DepositService admin manual deposit processing', () => {
  let tx: MockTransaction;
  let prisma: { $transaction: jest.Mock };
  let ledger: jest.Mocked<Pick<WalletLedgerService, 'creditWallet'>>;
  let shared: jest.Mocked<
    Pick<WalletSharedService, 'expireStaleManualDeposits' | 'getOrCreateWallet'>
  >;
  let service: DepositService;

  beforeEach(() => {
    tx = {
      manualDepositRequest: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
        findUniqueOrThrow: jest.fn(),
      },
      notification: {
        create: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
    };
    prisma = {
      $transaction: jest.fn((callback: (client: MockTransaction) => unknown) =>
        callback(tx),
      ),
    };
    ledger = {
      creditWallet: jest.fn(),
    };
    shared = {
      expireStaleManualDeposits: jest.fn(),
      getOrCreateWallet: jest.fn(),
    };
    service = new DepositService(
      prisma as never,
      {} as VnpayService,
      {} as ConfigService,
      ledger as unknown as WalletLedgerService,
      shared as unknown as WalletSharedService,
    );
  });

  it('approves a pending manual deposit by claiming pending state before credit', async () => {
    tx.manualDepositRequest.findUnique.mockResolvedValue({
      id: 9,
      providerId: 2,
      amount: 10000,
      status: 'PENDING',
    });
    tx.manualDepositRequest.updateMany.mockResolvedValue({ count: 1 });
    shared.getOrCreateWallet.mockResolvedValue({ id: 5 } as never);
    ledger.creditWallet.mockResolvedValue({ id: 88 } as never);
    tx.manualDepositRequest.findUniqueOrThrow.mockResolvedValue({ id: 9 });

    await expect(
      service.adminApproveManualDeposit(1, 9, 'ok'),
    ).resolves.toMatchObject({
      data: { id: 9 },
      message: 'Đã xác nhận nạp tiền',
    });

    const updateCalls = tx.manualDepositRequest.updateMany.mock
      .calls as unknown as Array<
      [{ where: { id: number; status: string }; data: { status: string } }]
    >;
    const updateArgs = updateCalls[0]?.[0];
    expect(updateArgs?.where).toEqual({ id: 9, status: 'PENDING' });
    expect(updateArgs?.data).toMatchObject({ status: 'APPROVED' });

    const ledgerCalls = ledger.creditWallet.mock.calls as unknown as Array<
      [unknown, { idempotencyKey?: string | null }]
    >;
    const ledgerArgs = ledgerCalls[0]?.[1];
    expect(ledgerArgs?.idempotencyKey).toBe('manual-deposit:9');
  });

  it('rejects duplicate manual deposit approve without crediting wallet', async () => {
    tx.manualDepositRequest.findUnique.mockResolvedValue({
      id: 9,
      providerId: 2,
      amount: 10000,
      status: 'PENDING',
    });
    tx.manualDepositRequest.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.adminApproveManualDeposit(1, 9),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(ledger.creditWallet).not.toHaveBeenCalled();
  });
});
