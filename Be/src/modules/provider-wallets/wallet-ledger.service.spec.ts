import { Prisma, WalletTransactionType } from '@prisma/client';
import { WalletLedgerService } from './wallet-ledger.service';

type MockTx = {
  walletTransaction: {
    create: jest.Mock;
  };
  providerWallet: {
    update: jest.Mock;
  };
};

type WalletCreateArg = {
  data: {
    walletId: number;
    amount: number;
    status: string;
    idempotencyKey: string;
  };
};

describe('WalletLedgerService', () => {
  let service: WalletLedgerService;
  let tx: MockTx;

  beforeEach(() => {
    service = new WalletLedgerService();
    tx = {
      walletTransaction: {
        create: jest.fn().mockResolvedValue({ id: 10 }),
      },
      providerWallet: {
        update: jest.fn(),
      },
    };
  });

  it('credits wallet and clears restriction when balance becomes non-negative', async () => {
    tx.providerWallet.update
      .mockResolvedValueOnce({ id: 1, balance: 5000, isRestricted: true })
      .mockResolvedValueOnce({ id: 1, balance: 5000, isRestricted: false });

    await expect(
      service.creditWallet(tx as unknown as Prisma.TransactionClient, {
        walletId: 1,
        amount: 5000,
        type: WalletTransactionType.DEPOSIT,
        idempotencyKey: 'deposit:1',
      }),
    ).resolves.toEqual({ id: 10 });

    const createMock = tx.walletTransaction.create as jest.Mock<
      unknown,
      [WalletCreateArg]
    >;
    const createArg = createMock.mock.calls[0]?.[0];
    expect(createArg.data).toMatchObject({
      walletId: 1,
      amount: 5000,
      status: 'SUCCESS',
      idempotencyKey: 'deposit:1',
    });
    expect(tx.providerWallet.update).toHaveBeenNthCalledWith(2, {
      where: { id: 1 },
      data: { isRestricted: false },
    });
  });

  it('debits wallet and restricts it when balance becomes negative', async () => {
    tx.providerWallet.update
      .mockResolvedValueOnce({ id: 1, balance: -1000, isRestricted: false })
      .mockResolvedValueOnce({ id: 1, balance: -1000, isRestricted: true });

    await service.debitWallet(tx as unknown as Prisma.TransactionClient, {
      walletId: 1,
      amount: 1000,
      type: WalletTransactionType.WITHDRAWAL,
      idempotencyKey: 'withdrawal:1',
    });

    const createMock = tx.walletTransaction.create as jest.Mock<
      unknown,
      [WalletCreateArg]
    >;
    const createArg = createMock.mock.calls[0]?.[0];
    expect(createArg.data).toMatchObject({
      walletId: 1,
      amount: -1000,
      status: 'SUCCESS',
      idempotencyKey: 'withdrawal:1',
    });
    expect(tx.providerWallet.update).toHaveBeenNthCalledWith(2, {
      where: { id: 1 },
      data: { isRestricted: true },
    });
  });
});
