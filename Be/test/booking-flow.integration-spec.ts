import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import {
  BookingStatus,
  ServiceStatus,
  UserRole,
  UserStatus,
} from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../src/prisma/prisma.service';
import { CloudinaryService } from '../src/shared/cloudinary/cloudinary.service';
import { RedisService } from '../src/shared/redis/redis.service';
import { JobsService } from '../src/shared/jobs/jobs.service';
import { DepositService } from '../src/modules/provider-wallets/deposit.service';
import { WithdrawalService } from '../src/modules/provider-wallets/withdrawal.service';
import { WalletLedgerService } from '../src/modules/provider-wallets/wallet-ledger.service';
import { WalletSharedService } from '../src/modules/provider-wallets/wallet-shared.service';
import { VnpayService } from '../src/modules/provider-wallets/vnpay.service';
import { BookingLifecycleService } from '../src/modules/bookings/booking-lifecycle.service';
import { BookingDisputeService } from '../src/modules/bookings/booking-dispute.service';
import { BookingQueryService } from '../src/modules/bookings/booking-query.service';
import { BookingCommissionService } from '../src/modules/bookings/booking-commission.service';
import { BookingSharedService } from '../src/modules/bookings/booking-shared.service';
import { BookingStatePolicy } from '../src/modules/bookings/booking-state.policy';
import { BookingTimeoutService } from '../src/modules/bookings/booking-timeout.service';

const testFile = {
  fieldname: 'resultImages',
  originalname: 'result.jpg',
  encoding: '7bit',
  mimetype: 'image/jpeg',
  buffer: Buffer.from('test'),
  size: 4,
  stream: undefined,
  destination: '',
  filename: '',
  path: '',
} as unknown as Express.Multer.File;

describe('Booking flow integration', () => {
  let moduleRef: TestingModule;
  let prisma: PrismaService;
  let lifecycle: BookingLifecycleService;
  let dispute: BookingDisputeService;
  let timeout: BookingTimeoutService;
  let policy: BookingStatePolicy;
  let deposit: DepositService;
  let withdrawal: WithdrawalService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      providers: [
        PrismaService,
        BookingLifecycleService,
        BookingDisputeService,
        BookingQueryService,
        BookingCommissionService,
        BookingSharedService,
        BookingStatePolicy,
        BookingTimeoutService,
        DepositService,
        WithdrawalService,
        WalletLedgerService,
        WalletSharedService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const values: Record<string, string> = {
                FRONTEND_URL: 'http://localhost:3000',
                VNPAY_RETURN_URL: 'http://localhost:3000/payment/return',
                VNPAY_IPN_URL: 'http://localhost:3000/payment/ipn',
              };

              return values[key];
            }),
          },
        },
        {
          provide: VnpayService,
          useValue: { createPaymentUrl: jest.fn() },
        },
        {
          provide: EventEmitter2,
          useValue: { emit: jest.fn() },
        },
        {
          provide: CloudinaryService,
          useValue: {
            uploadFile: jest
              .fn()
              .mockResolvedValue({ url: 'https://cdn.test/result.jpg' }),
          },
        },
        {
          provide: RedisService,
          useValue: { exists: jest.fn().mockResolvedValue(false) },
        },
        {
          provide: JobsService,
          useValue: { enqueue: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    prisma = moduleRef.get(PrismaService);
    lifecycle = moduleRef.get(BookingLifecycleService);
    dispute = moduleRef.get(BookingDisputeService);
    timeout = moduleRef.get(BookingTimeoutService);
    policy = moduleRef.get(BookingStatePolicy);
    deposit = moduleRef.get(DepositService);
    withdrawal = moduleRef.get(WithdrawalService);
    await prisma.$connect();
  });

  beforeEach(async () => {
    await truncateBusinessTables(prisma);
  });

  afterAll(async () => {
    await truncateBusinessTables(prisma);
    await moduleRef.close();
  });

  it('completes booking flow and deducts commission from provider wallet', async () => {
    const seed = await seedActiveService(prisma);

    const created = await lifecycle.create(seed.customer.id, {
      serviceId: seed.service.id,
      description: 'Sửa điều hòa',
      province: 'HCM',
      district: 'Quận 1',
      ward: 'Bến Nghé',
      addressDetail: '1 Lê Lợi',
      desiredTime: new Date(Date.now() + 86_400_000).toISOString(),
    });

    const bookingId = created.data!.id;
    await lifecycle.acceptByProvider(seed.provider.id, bookingId);
    await lifecycle.confirmSurveyor(seed.provider.id, bookingId, {
      surveyorName: 'Thợ A',
      surveyorPhone: '0900000000',
    });
    await lifecycle.sendQuote(seed.provider.id, bookingId, {
      estimatedTime: '2 giờ',
      note: 'Báo giá test',
      items: [
        {
          name: 'Sửa điều hòa',
          unit: 'Lần',
          price: 200000,
          quantity: 1,
        },
      ],
    });
    await lifecycle.customerConfirmQuote(seed.customer.id, bookingId);
    await lifecycle.startWork(seed.provider.id, bookingId);
    await lifecycle.completeWork(seed.provider.id, bookingId, [testFile]);
    await lifecycle.customerAccept(seed.customer.id, bookingId);

    const wallet = await prisma.providerWallet.findUniqueOrThrow({
      where: { providerId: seed.provider.id },
    });
    const commissionTx = await prisma.walletTransaction.findFirstOrThrow({
      where: { bookingId, type: 'COMMISSION' },
    });
    const acceptedBooking = await prisma.booking.findUniqueOrThrow({
      where: { id: bookingId },
    });

    expect(Number(wallet.balance)).toBe(80000);
    expect(Number(commissionTx.amount)).toBe(-20000);
    expect(acceptedBooking.status).toBe(BookingStatus.DONE);
    expect(acceptedBooking.autoCompletedAt).toBeInstanceOf(Date);
  });

  it('rejects invalid status transitions through policy', () => {
    expect(() =>
      policy.assertTransition(BookingStatus.PENDING, BookingStatus.DONE),
    ).toThrow(BadRequestException);
  });

  it('resolves customer dispute with provider penalty in one transaction', async () => {
    const seed = await seedActiveService(prisma);
    const booking = await seedDoneBooking(prisma, seed);

    const disputed = await dispute.customerDispute(
      seed.customer.id,
      booking.id,
      {
        reason: 'Kết quả chưa đạt',
      },
    );

    await dispute.resolveDispute(
      seed.admin.id,
      disputed.data.dispute.id,
      {
        resolutionAction: 'PENALIZE',
        resolutionReason: 'Phạt nhà cung cấp',
        penaltyAmount: 30000,
      },
      '127.0.0.1',
    );

    const resolved = await prisma.dispute.findUniqueOrThrow({
      where: { id: disputed.data.dispute.id },
    });
    const wallet = await prisma.providerWallet.findUniqueOrThrow({
      where: { providerId: seed.provider.id },
    });
    const audit = await prisma.auditLog.findFirstOrThrow({
      where: { targetType: 'DISPUTE', targetId: resolved.id },
    });

    expect(resolved.status).toBe('RESOLVED');
    expect(Number(wallet.balance)).toBe(70000);
    expect(audit.action).toBe('RESOLVE_DISPUTE_PENALIZE');
  });

  it('expires pending provider acceptance and records status history', async () => {
    const seed = await seedActiveService(prisma);
    const booking = await prisma.booking.create({
      data: {
        bookingCode: `TO${Date.now()}`,
        customerId: seed.customer.id,
        providerId: seed.provider.id,
        serviceId: seed.service.id,
        description: 'Timeout test',
        province: 'HCM',
        district: 'Quận 1',
        ward: 'Bến Nghé',
        addressDetail: '1 Lê Lợi',
        desiredTime: new Date(Date.now() + 86_400_000),
        status: BookingStatus.PENDING,
        providerResponseDeadline: new Date(Date.now() - 1000),
      },
    });

    const expired = await timeout.expireProviderAcceptance(booking.id);
    const updated = await prisma.booking.findUniqueOrThrow({
      where: { id: booking.id },
    });
    const history = await prisma.bookingStatusHistory.findFirstOrThrow({
      where: { bookingId: booking.id, toStatus: BookingStatus.CANCELLED },
    });

    expect(expired).toBe(true);
    expect(updated.status).toBe(BookingStatus.CANCELLED);
    expect(history.note).toContain('Quá 1 phút');
  });

  it('admin cancel records cancellation history', async () => {
    const seed = await seedActiveService(prisma);
    const booking = await seedConfirmedBooking(prisma, seed);

    await lifecycle.cancelByAdmin(seed.admin.id, booking.id, {
      reason: 'Khách yêu cầu hủy qua admin',
    });

    const updated = await prisma.booking.findUniqueOrThrow({
      where: { id: booking.id },
    });
    const history = await prisma.bookingStatusHistory.findFirstOrThrow({
      where: { bookingId: booking.id, toStatus: BookingStatus.CANCELLED },
    });

    expect(updated.status).toBe(BookingStatus.CANCELLED);
    expect(history.note).toContain('Admin hủy đơn');
  });

  it('manual deposit approve is atomic and cannot be processed twice', async () => {
    const seed = await seedActiveService(prisma);
    const request = await prisma.manualDepositRequest.create({
      data: {
        providerId: seed.provider.id,
        amount: 10000,
        transferCode: 'MANUAL-TEST-1',
      },
    });

    await deposit.adminApproveManualDeposit(seed.admin.id, request.id, 'ok');
    await expect(
      deposit.adminApproveManualDeposit(seed.admin.id, request.id, 'again'),
    ).rejects.toThrow(BadRequestException);
    await expect(
      deposit.adminRejectManualDeposit(seed.admin.id, request.id, 'reject'),
    ).rejects.toThrow(BadRequestException);

    const wallet = await prisma.providerWallet.findUniqueOrThrow({
      where: { providerId: seed.provider.id },
    });
    const transactions = await prisma.walletTransaction.findMany({
      where: { idempotencyKey: `manual-deposit:${request.id}` },
    });
    const updated = await prisma.manualDepositRequest.findUniqueOrThrow({
      where: { id: request.id },
    });

    expect(updated.status).toBe('APPROVED');
    expect(Number(wallet.balance)).toBe(110000);
    expect(transactions).toHaveLength(1);
  });

  it('withdrawal approve is atomic and cannot be processed twice', async () => {
    const seed = await seedActiveService(prisma);
    const request = await prisma.withdrawalRequest.create({
      data: {
        providerId: seed.provider.id,
        amount: 50000,
        bankName: 'Test Bank',
        bankAccountNumber: '123456789',
        bankAccountHolder: 'Provider Test',
      },
    });

    await withdrawal.adminApproveWithdrawal(seed.admin.id, request.id, 'ok');
    await expect(
      withdrawal.adminApproveWithdrawal(seed.admin.id, request.id, 'again'),
    ).rejects.toThrow(BadRequestException);
    await expect(
      withdrawal.adminRejectWithdrawal(seed.admin.id, request.id, 'reject'),
    ).rejects.toThrow(BadRequestException);

    const wallet = await prisma.providerWallet.findUniqueOrThrow({
      where: { providerId: seed.provider.id },
    });
    const transactions = await prisma.walletTransaction.findMany({
      where: { idempotencyKey: `withdrawal:${request.id}` },
    });
    const updated = await prisma.withdrawalRequest.findUniqueOrThrow({
      where: { id: request.id },
    });

    expect(updated.status).toBe('APPROVED');
    expect(Number(wallet.balance)).toBe(50000);
    expect(transactions).toHaveLength(1);
  });

  it('rejecting manual deposit or withdrawal prevents later approval', async () => {
    const seed = await seedActiveService(prisma);
    const manualDeposit = await prisma.manualDepositRequest.create({
      data: {
        providerId: seed.provider.id,
        amount: 10000,
        transferCode: 'MANUAL-TEST-2',
      },
    });
    const withdrawalRequest = await prisma.withdrawalRequest.create({
      data: {
        providerId: seed.provider.id,
        amount: 50000,
        bankName: 'Test Bank',
        bankAccountNumber: '123456789',
        bankAccountHolder: 'Provider Test',
      },
    });

    await deposit.adminRejectManualDeposit(
      seed.admin.id,
      manualDeposit.id,
      'reject',
    );
    await withdrawal.adminRejectWithdrawal(
      seed.admin.id,
      withdrawalRequest.id,
      'reject',
    );

    await expect(
      deposit.adminApproveManualDeposit(seed.admin.id, manualDeposit.id, 'ok'),
    ).rejects.toThrow(BadRequestException);
    await expect(
      withdrawal.adminApproveWithdrawal(seed.admin.id, withdrawalRequest.id),
    ).rejects.toThrow(BadRequestException);

    const wallet = await prisma.providerWallet.findUniqueOrThrow({
      where: { providerId: seed.provider.id },
    });
    expect(Number(wallet.balance)).toBe(100000);
  });
});

async function truncateBusinessTables(prisma: PrismaService) {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      wallet_transactions,
      withdrawal_requests,
      manual_deposit_requests,
      provider_wallets,
      dispute_evidences,
      disputes,
      booking_status_histories,
      booking_attachments,
      quotations,
      conversations,
      bookings,
      audit_logs,
      notifications,
      services,
      service_categories,
      commission_configs,
      system_settings,
      users
    RESTART IDENTITY CASCADE
  `);
}

async function seedActiveService(prisma: PrismaService) {
  const [admin, customer, provider] = await Promise.all([
    prisma.user.create({
      data: {
        email: `admin-${Date.now()}@test.local`,
        fullName: 'Admin',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: `customer-${Date.now()}@test.local`,
        fullName: 'Customer',
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: `provider-${Date.now()}@test.local`,
        fullName: 'Provider',
        role: UserRole.PROVIDER,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      },
    }),
  ]);

  const category = await prisma.serviceCategory.create({
    data: { name: `Điện lạnh ${Date.now()}` },
  });
  const service = await prisma.service.create({
    data: {
      providerId: provider.id,
      categoryId: category.id,
      name: 'Sửa điều hòa',
      description: 'Dịch vụ test',
      referencePrice: 200000,
      status: ServiceStatus.ACTIVE,
    },
  });

  await prisma.providerWallet.create({
    data: { providerId: provider.id, balance: 100000 },
  });
  await prisma.systemSetting.create({
    data: { key: 'commission_rate', value: JSON.stringify({ rate: 10 }) },
  });
  await prisma.commissionConfig.create({
    data: {
      rate: 10,
      configuredBy: admin.id,
      effectiveFrom: new Date(),
    },
  });

  return { admin, customer, provider, category, service };
}

async function seedConfirmedBooking(
  prisma: PrismaService,
  seed: Awaited<ReturnType<typeof seedActiveService>>,
) {
  return prisma.booking.create({
    data: {
      bookingCode: `CF${Date.now()}`,
      customerId: seed.customer.id,
      providerId: seed.provider.id,
      serviceId: seed.service.id,
      description: 'Confirmed booking',
      province: 'HCM',
      district: 'Quận 1',
      ward: 'Bến Nghé',
      addressDetail: '1 Lê Lợi',
      desiredTime: new Date(Date.now() + 86_400_000),
      status: BookingStatus.CONFIRMED,
      providerAcceptedAt: new Date(),
    },
  });
}

async function seedDoneBooking(
  prisma: PrismaService,
  seed: Awaited<ReturnType<typeof seedActiveService>>,
) {
  const booking = await prisma.booking.create({
    data: {
      bookingCode: `DN${Date.now()}`,
      customerId: seed.customer.id,
      providerId: seed.provider.id,
      serviceId: seed.service.id,
      description: 'Done booking',
      province: 'HCM',
      district: 'Quận 1',
      ward: 'Bến Nghé',
      addressDetail: '1 Lê Lợi',
      desiredTime: new Date(Date.now() + 86_400_000),
      status: BookingStatus.DONE,
      providerAcceptedAt: new Date(),
      completedAt: new Date(),
    },
  });
  await prisma.quotation.create({
    data: {
      bookingId: booking.id,
      actualPrice: 200000,
      commissionRateSnapshot: 10,
      estimatedTime: '2 giờ',
    },
  });
  return booking;
}
