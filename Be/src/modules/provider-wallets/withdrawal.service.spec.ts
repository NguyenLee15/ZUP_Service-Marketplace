import { BadRequestException } from '@nestjs/common';
import { WalletLedgerService } from './wallet-ledger.service';
import { WalletSharedService } from './wallet-shared.service';
import { WithdrawalService } from './withdrawal.service';

type MockTransaction = {
  withdrawalRequest: {
    findUnique: jest.Mock;
    updateMany: jest.Mock;
    findUniqueOrThrow: jest.Mock;
  };
  providerWallet: {
    findUnique: jest.Mock;
  };
  notification: {
    create: jest.Mock;
  };
  auditLog: {
    create: jest.Mock;
  };
};

describe('WithdrawalService admin processing', () => {
  let tx: MockTransaction;
  let prisma: { $transaction: jest.Mock };
  let ledger: jest.Mocked<Pick<WalletLedgerService, 'debitWallet'>>;
  let service: WithdrawalService;

  beforeEach(() => {
    tx = {
      withdrawalRequest: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
        findUniqueOrThrow: jest.fn(),
      },
      providerWallet: {
        findUnique: jest.fn(),
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
      debitWallet: jest.fn(),
    };
    service = new WithdrawalService(
      prisma as never,
      ledger as unknown as WalletLedgerService,
      {} as WalletSharedService,
    );
  });

  it('approves a pending withdrawal by claiming pending state before ledger debit', async () => {
    tx.withdrawalRequest.findUnique.mockResolvedValue({
      id: 7,
      providerId: 2,
      amount: 50000,
      status: 'PENDING',
    });
    tx.withdrawalRequest.updateMany.mockResolvedValue({ count: 1 });
    tx.providerWallet.findUnique.mockResolvedValue({
      id: 3,
      providerId: 2,
      balance: 100000,
    });
    ledger.debitWallet.mockResolvedValue({ id: 99 } as never);
    tx.withdrawalRequest.findUniqueOrThrow.mockResolvedValue({ id: 7 });

    await expect(
      service.adminApproveWithdrawal(1, 7, 'ok'),
    ).resolves.toMatchObject({
      data: { id: 7 },
      message: 'Đã xác nhận rút tiền',
    });

    const updateCalls = tx.withdrawalRequest.updateMany.mock
      .calls as unknown as Array<
      [{ where: { id: number; status: string }; data: { status: string } }]
    >;
    const updateArgs = updateCalls[0]?.[0];
    expect(updateArgs?.where).toEqual({ id: 7, status: 'PENDING' });
    expect(updateArgs?.data).toMatchObject({ status: 'APPROVED' });

    const ledgerCalls = ledger.debitWallet.mock.calls as unknown as Array<
      [unknown, { idempotencyKey?: string | null }]
    >;
    const ledgerArgs = ledgerCalls[0]?.[1];
    expect(ledgerArgs?.idempotencyKey).toBe('withdrawal:7');
  });

  it('rejects duplicate approve without creating a wallet transaction', async () => {
    tx.withdrawalRequest.findUnique.mockResolvedValue({
      id: 7,
      providerId: 2,
      amount: 50000,
      status: 'PENDING',
    });
    tx.withdrawalRequest.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.adminApproveWithdrawal(1, 7)).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(ledger.debitWallet).not.toHaveBeenCalled();
  });
});
