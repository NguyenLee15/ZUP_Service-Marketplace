import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  INestApplication,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../src/common/guards/permissions.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import {
  AdminDisputesController,
  BookingsController,
  ProviderBookingsController,
} from '../src/modules/bookings/controllers';
import { BookingDisputeService } from '../src/modules/bookings/booking-dispute.service';
import { BookingLifecycleService } from '../src/modules/bookings/booking-lifecycle.service';
import { BookingQueryService } from '../src/modules/bookings/booking-query.service';
import { CustomerBookingExportService } from '../src/modules/bookings/customer-booking-export.service';
import { BookingIntentService } from '../src/modules/bookings/booking-intent.service';
import {
  AdminWalletDepositsController,
  AdminWalletWithdrawalsController,
  ProviderWalletsController,
} from '../src/modules/provider-wallets/provider-wallets.controller';
import { DepositService } from '../src/modules/provider-wallets/deposit.service';
import { PaymentCallbackService } from '../src/modules/provider-wallets/payment-callback.service';
import { WalletAccountService } from '../src/modules/provider-wallets/wallet-account.service';
import { WithdrawalService } from '../src/modules/provider-wallets/withdrawal.service';
import { PayosService } from '../src/modules/provider-wallets/payos.service';
import {
  AdminServicesController,
  ServicesController,
} from '../src/modules/services/controllers';
import { FeaturedListingsService } from '../src/modules/services/featured-listings.service';
import { ProviderPublicService } from '../src/modules/services/provider-public.service';
import { ServiceCommandService } from '../src/modules/services/service-command.service';
import { ServiceModerationService } from '../src/modules/services/service-moderation.service';
import { ServiceSearchService } from '../src/modules/services/service-search.service';
import { AiService } from '../src/shared/ai/ai.service';

interface WrappedResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

type AsyncMock = jest.Mock<Promise<unknown>, unknown[]>;

type ServiceMocks = {
  lifecycle: {
    create: AsyncMock;
    acceptByProvider: AsyncMock;
    sendQuote: AsyncMock;
    customerConfirmQuote: AsyncMock;
    startWork: AsyncMock;
    completeWork: AsyncMock;
    customerAccept: AsyncMock;
  };
  dispute: {
    customerDispute: AsyncMock;
    resolveDispute: AsyncMock;
  };
  query: {
    getMyBookings: AsyncMock;
    getById: AsyncMock;
  };
  walletAccount: {
    getBalance: AsyncMock;
  };
  deposit: {
    createDepositRequest: AsyncMock;
    adminApproveManualDeposit: AsyncMock;
    adminRejectManualDeposit: AsyncMock;
  };
  withdrawal: {
    adminApproveWithdrawal: AsyncMock;
  };
  paymentCallback: {
    handleVnpayIpn: AsyncMock;
  };
  serviceSearch: {
    search: AsyncMock;
  };
  providerPublic: {
    getPublicDetail: AsyncMock;
  };
};

class TestAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      user?: { id: number; email: string; role: UserRole };
    }>();
    const userIdHeader = request.headers['x-test-user-id'];
    const roleHeader = request.headers['x-test-role'];
    const id = Number(
      Array.isArray(userIdHeader) ? userIdHeader[0] : userIdHeader,
    );
    const roleValue = Array.isArray(roleHeader) ? roleHeader[0] : roleHeader;
    const role = isUserRole(roleValue) ? roleValue : UserRole.CUSTOMER;
    request.user = {
      id: Number.isInteger(id) && id > 0 ? id : 1,
      email: `${role.toLowerCase()}@test.local`,
      role,
    };
    return true;
  }
}

class AllowRolesGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}

describe('Booking/wallet production flow (e2e)', () => {
  let app: INestApplication<App>;
  let mocks: ServiceMocks;

  beforeAll(async () => {
    mocks = createMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [
        ServicesController,
        AdminServicesController,
        BookingsController,
        ProviderBookingsController,
        AdminDisputesController,
        ProviderWalletsController,
        AdminWalletDepositsController,
        AdminWalletWithdrawalsController,
      ],
      providers: [
        { provide: BookingLifecycleService, useValue: mocks.lifecycle },
        { provide: BookingDisputeService, useValue: mocks.dispute },
        { provide: BookingQueryService, useValue: mocks.query },
        { provide: CustomerBookingExportService, useValue: {} },
        { provide: BookingIntentService, useValue: {} },
        { provide: WalletAccountService, useValue: mocks.walletAccount },
        { provide: DepositService, useValue: mocks.deposit },
        { provide: WithdrawalService, useValue: mocks.withdrawal },
        { provide: PaymentCallbackService, useValue: mocks.paymentCallback },
        {
          provide: PayosService,
          useValue: {
            createDepositRequest: jest.fn(),
            verifyWebhook: jest.fn(),
          },
        },
        { provide: ServiceSearchService, useValue: mocks.serviceSearch },
        { provide: ProviderPublicService, useValue: mocks.providerPublic },
        { provide: ServiceCommandService, useValue: {} },
        { provide: ServiceModerationService, useValue: {} },
        { provide: FeaturedListingsService, useValue: {} },
        {
          provide: AiService,
          useValue: { generateText: jest.fn(), generateEmbedding: jest.fn() },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(TestAuthGuard)
      .overrideGuard(RolesGuard)
      .useClass(AllowRolesGuard)
      .overrideGuard(PermissionsGuard)
      .useClass(AllowRolesGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('wraps service search/detail responses with success/data/meta', async () => {
    mocks.serviceSearch.search.mockResolvedValue({
      data: [{ id: 10, name: 'Sửa máy lạnh' }],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });
    mocks.providerPublic.getPublicDetail.mockResolvedValue({
      data: { id: 10, providerId: 2, name: 'Sửa máy lạnh' },
    });

    const searchResponse = await request(app.getHttpServer())
      .get('/services/search?keyword=may%20lanh&page=1&limit=10')
      .expect(200);
    const searchBody = searchResponse.body as WrappedResponse;
    expect(searchBody.success).toBe(true);
    expect(searchBody.meta?.total).toBe(1);

    const detailResponse = await request(app.getHttpServer())
      .get('/services/10')
      .expect(200);
    const detailBody = detailResponse.body as WrappedResponse;
    expect(detailBody.success).toBe(true);
    expect(detailBody.data).toMatchObject({ id: 10, providerId: 2 });
  });

  it('runs the customer/provider booking lifecycle through current routes', async () => {
    mocks.lifecycle.create.mockResolvedValue({
      data: { id: 100, status: 'PENDING' },
    });
    mocks.lifecycle.acceptByProvider.mockResolvedValue({
      data: { id: 100, status: 'ACCEPTED' },
    });
    mocks.lifecycle.sendQuote.mockResolvedValue({
      data: { id: 100, status: 'QUOTED' },
    });
    mocks.lifecycle.customerConfirmQuote.mockResolvedValue({
      data: { id: 100, status: 'CONFIRMED' },
    });
    mocks.lifecycle.startWork.mockResolvedValue({
      data: { id: 100, status: 'IN_PROGRESS' },
    });
    mocks.lifecycle.completeWork.mockResolvedValue({
      data: { id: 100, status: 'DONE' },
    });
    mocks.lifecycle.customerAccept.mockResolvedValue({
      data: { id: 100, status: 'DONE', accepted: true },
    });

    await request(app.getHttpServer())
      .post('/bookings')
      .set('x-test-user-id', '1')
      .set('x-test-role', 'CUSTOMER')
      .send({
        serviceId: 10,
        description: 'Cần sửa',
        desiredTime: new Date().toISOString(),
      })
      .expect(201);
    await request(app.getHttpServer())
      .patch('/provider/bookings/100/accept')
      .set('x-test-user-id', '2')
      .set('x-test-role', 'PROVIDER')
      .expect(200);
    await request(app.getHttpServer())
      .post('/provider/bookings/100/quote')
      .set('x-test-user-id', '2')
      .set('x-test-role', 'PROVIDER')
      .send({ amount: 200000, note: 'Báo giá' })
      .expect(201);
    await request(app.getHttpServer())
      .patch('/bookings/100/confirm-quote')
      .set('x-test-user-id', '1')
      .set('x-test-role', 'CUSTOMER')
      .expect(200);
    await request(app.getHttpServer())
      .patch('/provider/bookings/100/start')
      .set('x-test-user-id', '2')
      .set('x-test-role', 'PROVIDER')
      .expect(200);
    await request(app.getHttpServer())
      .patch('/provider/bookings/100/complete')
      .set('x-test-user-id', '2')
      .set('x-test-role', 'PROVIDER')
      .expect(200);
    const acceptResponse = await request(app.getHttpServer())
      .patch('/bookings/100/accept')
      .set('x-test-user-id', '1')
      .set('x-test-role', 'CUSTOMER')
      .expect(200);

    const acceptBody = acceptResponse.body as WrappedResponse;
    expect(acceptBody).toMatchObject({
      success: true,
      data: { id: 100, status: 'DONE', accepted: true },
    });
    expect(mocks.lifecycle.create).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ serviceId: 10 }),
    );
    expect(mocks.lifecycle.acceptByProvider).toHaveBeenCalledWith(2, 100);
  });

  it('keeps VNPay IPN raw and handles duplicate callback consistently', async () => {
    mocks.deposit.createDepositRequest.mockResolvedValue({
      data: {
        paymentUrl: 'https://sandbox.vnpayment.vn/pay',
        url: 'https://sandbox.vnpayment.vn/pay',
        txnRef: 'VNPAY-1',
      },
    });
    mocks.paymentCallback.handleVnpayIpn.mockResolvedValue({
      RspCode: '00',
      Message: 'Confirm Success',
    });

    const depositResponse = await request(app.getHttpServer())
      .post('/provider-wallets/deposit')
      .set('x-test-user-id', '2')
      .set('x-test-role', 'PROVIDER')
      .send({ amount: 100000 })
      .expect(201);
    const depositBody = depositResponse.body as WrappedResponse;
    expect(depositBody.success).toBe(true);
    expect(depositBody.data).toMatchObject({ txnRef: 'VNPAY-1' });

    const firstIpn = await request(app.getHttpServer())
      .get('/provider-wallets/vnpay/ipn?vnp_TxnRef=VNPAY-1')
      .expect(200);
    const secondIpn = await request(app.getHttpServer())
      .get('/provider-wallets/vnpay/ipn?vnp_TxnRef=VNPAY-1')
      .expect(200);

    expect(firstIpn.body).toEqual({
      RspCode: '00',
      Message: 'Confirm Success',
    });
    expect(secondIpn.body).toEqual(firstIpn.body);
    expect(mocks.paymentCallback.handleVnpayIpn).toHaveBeenCalledTimes(2);
  });

  it('covers admin wallet and dispute routes including rejected double withdrawal', async () => {
    mocks.deposit.adminApproveManualDeposit.mockResolvedValue({
      data: { id: 501, status: 'APPROVED' },
      message: 'Đã xác nhận nạp tiền',
    });
    mocks.deposit.adminRejectManualDeposit.mockResolvedValue({
      data: { id: 502, status: 'REJECTED' },
      message: 'Đã từ chối yêu cầu nạp tiền',
    });
    mocks.withdrawal.adminApproveWithdrawal
      .mockResolvedValueOnce({
        data: { id: 601, status: 'APPROVED' },
        message: 'Đã xác nhận rút tiền',
      })
      .mockRejectedValueOnce(
        new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'Yêu cầu này đã được xử lý',
        }),
      );
    mocks.dispute.customerDispute.mockResolvedValue({
      data: { id: 701, status: 'PENDING' },
    });
    mocks.dispute.resolveDispute.mockResolvedValue({
      data: { id: 701, status: 'RESOLVED' },
      message: 'Đã xử lý khiếu nại',
    });

    await request(app.getHttpServer())
      .patch('/admin/wallet-deposits/501/approve')
      .set('x-test-user-id', '9')
      .set('x-test-role', 'ADMIN')
      .send({ note: 'ok' })
      .expect(200);
    await request(app.getHttpServer())
      .patch('/admin/wallet-deposits/502/reject')
      .set('x-test-user-id', '9')
      .set('x-test-role', 'ADMIN')
      .send({ note: 'reject' })
      .expect(200);
    await request(app.getHttpServer())
      .patch('/admin/wallet-withdrawals/601/approve')
      .set('x-test-user-id', '9')
      .set('x-test-role', 'ADMIN')
      .expect(200);
    const duplicateWithdrawal = await request(app.getHttpServer())
      .patch('/admin/wallet-withdrawals/601/approve')
      .set('x-test-user-id', '9')
      .set('x-test-role', 'ADMIN')
      .expect(400);
    const duplicateBody = duplicateWithdrawal.body as ErrorResponse;
    expect(duplicateBody.success).toBe(false);
    expect(duplicateBody.error.message).toBe('Yêu cầu này đã được xử lý');

    await request(app.getHttpServer())
      .post('/bookings/100/dispute')
      .set('x-test-user-id', '1')
      .set('x-test-role', 'CUSTOMER')
      .send({ reason: 'Chưa hài lòng' })
      .expect(201);
    const resolveResponse = await request(app.getHttpServer())
      .patch('/admin/disputes/701/resolve')
      .set('x-test-user-id', '9')
      .set('x-test-role', 'ADMIN')
      .send({ resolution: 'COMPLETE', adminNote: 'ok' })
      .expect(200);
    const resolveBody = resolveResponse.body as WrappedResponse;
    expect(resolveBody.success).toBe(true);
    expect(resolveBody.data).toMatchObject({ id: 701, status: 'RESOLVED' });
  });
});

function createMocks(): ServiceMocks {
  return {
    lifecycle: {
      create: mockAsync(),
      acceptByProvider: mockAsync(),
      sendQuote: mockAsync(),
      customerConfirmQuote: mockAsync(),
      startWork: mockAsync(),
      completeWork: mockAsync(),
      customerAccept: mockAsync(),
    },
    dispute: {
      customerDispute: mockAsync(),
      resolveDispute: mockAsync(),
    },
    query: {
      getMyBookings: mockAsync(),
      getById: mockAsync(),
    },
    walletAccount: {
      getBalance: mockAsync(),
    },
    deposit: {
      createDepositRequest: mockAsync(),
      adminApproveManualDeposit: mockAsync(),
      adminRejectManualDeposit: mockAsync(),
    },
    withdrawal: {
      adminApproveWithdrawal: mockAsync(),
    },
    paymentCallback: {
      handleVnpayIpn: mockAsync(),
    },
    serviceSearch: {
      search: mockAsync(),
    },
    providerPublic: {
      getPublicDetail: mockAsync(),
    },
  };
}

function mockAsync(): AsyncMock {
  return jest.fn<Promise<unknown>, unknown[]>();
}

function isUserRole(value: unknown): value is UserRole {
  return (
    typeof value === 'string' &&
    Object.values(UserRole).includes(value as UserRole)
  );
}
