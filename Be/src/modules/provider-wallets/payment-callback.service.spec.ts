import { Logger } from '@nestjs/common';
import { PaymentCallbackService } from './payment-callback.service';
import { PrismaService } from '../../prisma/prisma.service';
import { VnpayService } from './vnpay.service';

type MockPrisma = {
  walletTransaction: {
    findFirst: jest.Mock;
    update: jest.Mock;
  };
  $transaction: jest.Mock;
};

type MockTxClient = {
  walletTransaction: {
    updateMany: jest.Mock;
  };
  providerWallet: {
    update: jest.Mock;
  };
  notification: {
    create: jest.Mock;
  };
  auditLog: {
    create: jest.Mock;
  };
};

type MockVnpay = {
  verifyIpn: jest.Mock;
};

type WalletUpdateArg = {
  where: { id: number };
  data: { status: string };
};

describe('PaymentCallbackService', () => {
  const mockVnpay: MockVnpay = {
    verifyIpn: jest.fn(),
  };

  const createPrisma = () => {
    const txClient: MockTxClient = {
      walletTransaction: {
        updateMany: jest.fn(),
      },
      providerWallet: {
        update: jest.fn(),
      },
      notification: {
        create: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
    };

    const prisma: MockPrisma = {
      walletTransaction: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((cb: (tx: MockTxClient) => unknown) =>
        cb(txClient),
      ),
    };

    return { prisma, txClient };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('rejects invalid signatures without mutating transactions', async () => {
    const { prisma } = createPrisma();
    mockVnpay.verifyIpn.mockReturnValue({
      isValid: false,
      txnRef: 'ref-1',
      amount: 10000,
      responseCode: '00',
    });
    const service = new PaymentCallbackService(
      prisma as unknown as PrismaService,
      mockVnpay as unknown as VnpayService,
    );

    await expect(service.handleVnpayIpn({})).resolves.toEqual({
      RspCode: '97',
      Message: 'Invalid Checksum',
    });
    expect(prisma.walletTransaction.update).not.toHaveBeenCalled();
  });

  it('returns idempotent success for duplicate successful callbacks', async () => {
    const { prisma } = createPrisma();
    mockVnpay.verifyIpn.mockReturnValue({
      isValid: true,
      txnRef: 'ref-1',
      amount: 10000,
      responseCode: '00',
    });
    prisma.walletTransaction.findFirst.mockResolvedValueOnce({ id: 1 });
    const service = new PaymentCallbackService(
      prisma as unknown as PrismaService,
      mockVnpay as unknown as VnpayService,
    );

    await expect(service.handleVnpayIpn({})).resolves.toEqual({
      RspCode: '00',
      Message: 'Already processed',
    });
  });

  it('fails pending transaction when callback amount mismatches', async () => {
    const { prisma } = createPrisma();
    mockVnpay.verifyIpn.mockReturnValue({
      isValid: true,
      txnRef: 'ref-1',
      amount: 20000,
      responseCode: '00',
    });
    prisma.walletTransaction.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 1, amount: 10000 });
    const service = new PaymentCallbackService(
      prisma as unknown as PrismaService,
      mockVnpay as unknown as VnpayService,
    );

    await expect(service.handleVnpayIpn({})).resolves.toEqual({
      RspCode: '04',
      Message: 'Invalid amount',
    });
    const updateMock = prisma.walletTransaction.update as jest.Mock<
      unknown,
      [WalletUpdateArg]
    >;
    const updateArg = updateMock.mock.calls[0]?.[0];
    expect(updateArg.where).toEqual({ id: 1 });
    expect(updateArg.data.status).toBe('FAILED');
  });

  it('does not credit the wallet after another callback claims the transaction', async () => {
    const { prisma, txClient } = createPrisma();
    mockVnpay.verifyIpn.mockReturnValue({
      isValid: true,
      txnRef: 'ref-1',
      amount: 10000,
      responseCode: '00',
    });
    prisma.walletTransaction.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 1, walletId: 2, amount: 10000 });
    txClient.walletTransaction.updateMany.mockResolvedValue({ count: 0 });
    const service = new PaymentCallbackService(
      prisma as unknown as PrismaService,
      mockVnpay as unknown as VnpayService,
    );

    await expect(service.handleVnpayIpn({})).resolves.toEqual({
      RspCode: '00',
      Message: 'Already processed',
    });
    expect(txClient.providerWallet.update).not.toHaveBeenCalled();
  });
});
