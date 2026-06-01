import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AdminPermission } from '../src/common/constants/admin-permissions';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../src/common/guards/permissions.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { PrismaService } from '../src/prisma/prisma.service';
import { AdminController } from '../src/modules/admin/admin.controller';
import { AdminService } from '../src/modules/admin/services/admin.service';
import { AdminAuditLogService } from '../src/modules/admin/services/admin-audit-log.service';
import { AdminDashboardService } from '../src/modules/admin/services/admin-dashboard.service';
import { StaffAdminService } from '../src/modules/admin/services/staff-admin.service';
import {
  BookingsController,
  ProviderBookingsController,
} from '../src/modules/bookings/bookings.controller';
import { BookingDisputeService } from '../src/modules/bookings/booking-dispute.service';
import { BookingLifecycleService } from '../src/modules/bookings/booking-lifecycle.service';
import { BookingQueryService } from '../src/modules/bookings/booking-query.service';
import { CategoriesController } from '../src/modules/categories/categories.controller';
import { CategoriesService } from '../src/modules/categories/categories.service';
import { ProviderWalletsController } from '../src/modules/provider-wallets/provider-wallets.controller';
import { DepositService } from '../src/modules/provider-wallets/deposit.service';
import { PaymentCallbackService } from '../src/modules/provider-wallets/payment-callback.service';
import { WalletAccountService } from '../src/modules/provider-wallets/wallet-account.service';
import { WithdrawalService } from '../src/modules/provider-wallets/withdrawal.service';
import {
  AdminFeaturedListingsController,
  AdminFeaturedRateController,
  AdminServicesController,
  ServicesController,
} from '../src/modules/services/services.controller';
import { FeaturedListingsService } from '../src/modules/services/featured-listings.service';
import { ProviderPublicService } from '../src/modules/services/provider-public.service';
import { ServiceCommandService } from '../src/modules/services/service-command.service';
import { ServiceModerationService } from '../src/modules/services/service-moderation.service';
import { ServiceSearchService } from '../src/modules/services/service-search.service';
import { SettingsService } from '../src/modules/settings/settings.service';
import { KycService } from '../src/modules/users/kyc.service';
import { UsersController } from '../src/modules/users/users.controller';
import { UsersService } from '../src/modules/users/users.service';

type AsyncMock = jest.Mock<Promise<unknown>, unknown[]>;

class HeaderAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      user?: { id: number; email: string; role: UserRole };
    }>();

    if (req.headers['x-test-auth'] !== 'yes') {
      throw new UnauthorizedException();
    }

    const userIdHeader = req.headers['x-test-user-id'];
    const roleHeader = req.headers['x-test-role'];
    const id = Number(
      Array.isArray(userIdHeader) ? userIdHeader[0] : userIdHeader,
    );
    const roleValue = Array.isArray(roleHeader) ? roleHeader[0] : roleHeader;
    const role = isUserRole(roleValue) ? roleValue : UserRole.CUSTOMER;

    req.user = {
      id: Number.isInteger(id) && id > 0 ? id : 100,
      email: `${role.toLowerCase()}@test.local`,
      role,
    };

    return true;
  }
}

describe('Route security smoke (e2e)', () => {
  let app: INestApplication<App>;
  let mocks: ReturnType<typeof createMocks>;

  beforeAll(async () => {
    mocks = createMocks();

    const prisma = {
      user: {
        findUnique: jest.fn(({ where }: { where: { id: number } }) => {
          const permissionsByUserId: Record<number, string[]> = {
            201: [AdminPermission.USER_VIEW],
            202: [],
            203: [AdminPermission.SERVICE_MODERATE],
            204: [AdminPermission.AUDIT_LOG_VIEW],
            205: [AdminPermission.FINANCE_COMMISSION],
          };
          return Promise.resolve({
            permissions: permissionsByUserId[where.id] ?? [],
          });
        }),
      },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [
        UsersController,
        BookingsController,
        ProviderBookingsController,
        ProviderWalletsController,
        ServicesController,
        AdminServicesController,
        AdminFeaturedListingsController,
        AdminFeaturedRateController,
        CategoriesController,
        AdminController,
      ],
      providers: [
        RolesGuard,
        PermissionsGuard,
        { provide: PrismaService, useValue: prisma },
        { provide: UsersService, useValue: mocks.users },
        { provide: KycService, useValue: mocks.kyc },
        { provide: BookingLifecycleService, useValue: mocks.lifecycle },
        { provide: BookingDisputeService, useValue: mocks.dispute },
        { provide: BookingQueryService, useValue: mocks.bookingQuery },
        { provide: WalletAccountService, useValue: mocks.wallet },
        { provide: DepositService, useValue: mocks.deposit },
        { provide: WithdrawalService, useValue: mocks.withdrawal },
        { provide: PaymentCallbackService, useValue: mocks.paymentCallback },
        { provide: ServiceCommandService, useValue: mocks.command },
        { provide: ServiceSearchService, useValue: mocks.search },
        { provide: ProviderPublicService, useValue: mocks.providerPublic },
        { provide: FeaturedListingsService, useValue: mocks.featured },
        { provide: ServiceModerationService, useValue: mocks.moderation },
        { provide: CategoriesService, useValue: mocks.categories },
        { provide: AdminService, useValue: mocks.admin },
        { provide: AdminDashboardService, useValue: mocks.dashboard },
        { provide: StaffAdminService, useValue: mocks.staff },
        { provide: SettingsService, useValue: mocks.settings },
        { provide: AdminAuditLogService, useValue: mocks.audit },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(HeaderAuthGuard)
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
    seedSuccessfulMocks(mocks);
  });

  it('returns 401 when sensitive routes are called without auth', async () => {
    await request(app.getHttpServer()).get('/users/profile').expect(401);
    await request(app.getHttpServer())
      .get('/provider-wallets/balance')
      .expect(401);
    await request(app.getHttpServer()).get('/admin/users').expect(401);
  });

  it('returns 403 for wrong roles on customer and provider routes', async () => {
    await request(app.getHttpServer())
      .post('/bookings')
      .set(providerHeaders())
      .send({ serviceId: 1 })
      .expect(403);

    await request(app.getHttpServer())
      .get('/provider/bookings')
      .set(customerHeaders())
      .expect(403);

    await request(app.getHttpServer())
      .get('/provider-wallets/balance')
      .set(customerHeaders())
      .expect(403);

    await request(app.getHttpServer())
      .get('/services/my/list')
      .set(customerHeaders())
      .expect(403);
  });

  it('enforces STAFF permissions on admin routes', async () => {
    await request(app.getHttpServer())
      .get('/admin/users')
      .set(staffHeaders(202))
      .expect(403);

    await request(app.getHttpServer())
      .get('/admin/users')
      .set(staffHeaders(201))
      .expect(200);

    await request(app.getHttpServer())
      .get('/admin/audit-logs')
      .set(staffHeaders(202))
      .expect(403);

    await request(app.getHttpServer())
      .get('/admin/audit-logs')
      .set(staffHeaders(204))
      .expect(200);
  });

  it('enforces service moderation permission on admin services and category mutations', async () => {
    await request(app.getHttpServer())
      .get('/admin/services')
      .set(staffHeaders(202))
      .expect(403);

    await request(app.getHttpServer())
      .get('/admin/services')
      .set(staffHeaders(203))
      .expect(200);

    await request(app.getHttpServer())
      .get('/admin/featured-listings')
      .set(staffHeaders(202))
      .expect(403);

    await request(app.getHttpServer())
      .get('/admin/featured-listings')
      .set(staffHeaders(203))
      .expect(200);

    await request(app.getHttpServer())
      .post('/categories')
      .set(staffHeaders(202))
      .send({ name: 'Blocked' })
      .expect(403);

    await request(app.getHttpServer())
      .post('/categories')
      .set(staffHeaders(203))
      .send({ name: 'Allowed' })
      .expect(201);
  });

  it('enforces finance permission on featured rate setting', async () => {
    await request(app.getHttpServer())
      .get('/admin/settings/featured-rate')
      .set(staffHeaders(202))
      .expect(403);

    await request(app.getHttpServer())
      .get('/admin/settings/featured-rate')
      .set(staffHeaders(205))
      .expect(200);
  });

  it('keeps public routes public', async () => {
    await request(app.getHttpServer()).get('/services/search').expect(200);
    await request(app.getHttpServer()).get('/categories/tree').expect(200);

    const ipnResponse = await request(app.getHttpServer())
      .get('/provider-wallets/vnpay/ipn')
      .expect(200);

    expect(ipnResponse.body).toEqual({
      RspCode: '00',
      Message: 'Confirm Success',
    });
  });
});

function createMocks() {
  return {
    users: { getProfile: mockAsync() },
    kyc: {},
    lifecycle: { create: mockAsync() },
    dispute: {},
    bookingQuery: { getMyBookings: mockAsync(), getTimeline: mockAsync() },
    wallet: { getBalance: mockAsync() },
    deposit: {},
    withdrawal: {},
    paymentCallback: { handleVnpayIpn: mockAsync() },
    command: { getMyServices: mockAsync() },
    search: { search: mockAsync() },
    providerPublic: {},
    featured: {
      adminListFeaturedListings: mockAsync(),
      getFeaturedDailyRate: mockAsync(),
    },
    moderation: { getAll: mockAsync() },
    categories: { getTree: mockAsync(), create: mockAsync() },
    admin: { getUsers: mockAsync() },
    dashboard: {},
    staff: {},
    settings: {},
    audit: { getAuditLogs: mockAsync() },
  };
}

function seedSuccessfulMocks(mocks: ReturnType<typeof createMocks>) {
  mocks.users.getProfile.mockResolvedValue({ data: { id: 100 } });
  mocks.lifecycle.create.mockResolvedValue({ data: { id: 1 } });
  mocks.bookingQuery.getMyBookings.mockResolvedValue({
    data: [],
    meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
  });
  mocks.wallet.getBalance.mockResolvedValue({ data: { balance: 0 } });
  mocks.paymentCallback.handleVnpayIpn.mockResolvedValue({
    RspCode: '00',
    Message: 'Confirm Success',
  });
  mocks.command.getMyServices.mockResolvedValue({ data: [] });
  mocks.search.search.mockResolvedValue({
    data: [],
    meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
  });
  mocks.moderation.getAll.mockResolvedValue({
    data: [],
    meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
  });
  mocks.featured.adminListFeaturedListings.mockResolvedValue({
    data: [],
    meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
  });
  mocks.featured.getFeaturedDailyRate.mockResolvedValue({
    data: { dailyRate: 50000 },
  });
  mocks.categories.getTree.mockResolvedValue({ data: [] });
  mocks.categories.create.mockResolvedValue({ data: { id: 1 } });
  mocks.admin.getUsers.mockResolvedValue({
    data: [],
    meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
  });
  mocks.audit.getAuditLogs.mockResolvedValue({
    data: [],
    meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
  });
}

function customerHeaders() {
  return {
    'x-test-auth': 'yes',
    'x-test-user-id': '100',
    'x-test-role': UserRole.CUSTOMER,
  };
}

function providerHeaders() {
  return {
    'x-test-auth': 'yes',
    'x-test-user-id': '101',
    'x-test-role': UserRole.PROVIDER,
  };
}

function staffHeaders(userId: number) {
  return {
    'x-test-auth': 'yes',
    'x-test-user-id': String(userId),
    'x-test-role': UserRole.STAFF,
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
