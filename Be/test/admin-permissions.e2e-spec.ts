import {
  CanActivate,
  ExecutionContext,
  INestApplication,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AdminPermission } from '../src/common/constants/admin-permissions';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  AdminStaffsController,
  AdminAuditLogsController,
  AdminBookingsController,
} from '../src/modules/admin/controllers';
import { AdminService } from '../src/modules/admin/services/admin.service';
import { AdminDashboardService } from '../src/modules/admin/services/admin-dashboard.service';
import { StaffAdminService } from '../src/modules/admin/services/staff-admin.service';
import { SettingsService } from '../src/modules/settings/settings.service';
import { AdminAuditLogService } from '../src/modules/admin/services/admin-audit-log.service';
import { AdminWalletDepositsController } from '../src/modules/provider-wallets/provider-wallets.controller';
import { DepositService } from '../src/modules/provider-wallets/deposit.service';
import { AdminServicesController } from '../src/modules/services/controllers';
import { ServiceModerationService } from '../src/modules/services/service-moderation.service';
import { BookingQueryService } from '../src/modules/bookings/booking-query.service';

type AsyncMock = jest.Mock<Promise<unknown>, unknown[]>;

type AdminMocks = {
  admin: {
    getBookings: AsyncMock;
    cancelBooking: AsyncMock;
  };
  staff: {
    createStaff: AsyncMock;
    getStaffs: AsyncMock;
  };
  audit: {
    getAuditLogs: AsyncMock;
    exportAuditLogsCsv: AsyncMock;
  };
  deposit: {
    adminListManualDepositRequests: AsyncMock;
  };
  moderation: {
    getAll: AsyncMock;
  };
  bookingQuery: {
    getTimelineForAdmin: AsyncMock;
  };
};

interface PermissionMatrixResponse {
  success: true;
  data: Array<{
    group: string;
    permissions: unknown[];
  }>;
}

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
    const role = isUserRole(roleValue) ? roleValue : UserRole.STAFF;
    request.user = {
      id: Number.isInteger(id) && id > 0 ? id : 2,
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

describe('Admin permissions and audit logs (e2e)', () => {
  let app: INestApplication<App>;
  let mocks: AdminMocks;
  let prisma: {
    user: {
      findUnique: jest.Mock;
    };
  };

  beforeAll(async () => {
    mocks = createMocks();
    prisma = {
      user: {
        findUnique: jest.fn(({ where }: { where: { id: number } }) => {
          const permissionsByUserId: Record<number, string[]> = {
            2: [AdminPermission.AUDIT_LOG_VIEW],
            3: [],
            4: [AdminPermission.BOOKING_VIEW],
            5: [AdminPermission.STAFF_VIEW],
            6: [AdminPermission.WALLET_DEPOSIT_MANAGE],
            7: [AdminPermission.SERVICE_MODERATE],
          };
          return Promise.resolve({
            permissions: permissionsByUserId[where.id] ?? [],
          });
        }),
      },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [
        AdminStaffsController,
        AdminAuditLogsController,
        AdminBookingsController,
        AdminWalletDepositsController,
        AdminServicesController,
      ],
      providers: [
        { provide: AdminService, useValue: mocks.admin },
        { provide: AdminDashboardService, useValue: {} },
        { provide: StaffAdminService, useValue: mocks.staff },
        { provide: SettingsService, useValue: {} },
        { provide: AdminAuditLogService, useValue: mocks.audit },
        { provide: BookingQueryService, useValue: mocks.bookingQuery },
        { provide: DepositService, useValue: mocks.deposit },
        { provide: ServiceModerationService, useValue: mocks.moderation },
        { provide: PrismaService, useValue: prisma },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(TestAuthGuard)
      .overrideGuard(RolesGuard)
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

  it('lets ADMIN create staff with valid permissions', async () => {
    mocks.staff.createStaff.mockResolvedValue({
      id: 20,
      fullName: 'Staff',
      email: 'staff@test.local',
      role: UserRole.STAFF,
    });

    const response = await request(app.getHttpServer())
      .post('/admin/staffs')
      .set('x-test-user-id', '1')
      .set('x-test-role', 'ADMIN')
      .send({
        fullName: 'Staff',
        email: 'staff@test.local',
        password: 'Password123!',
        permissions: [AdminPermission.AUDIT_LOG_VIEW],
      })
      .expect(201);

    expect(response.body).toMatchObject({
      success: true,
      data: {
        id: 20,
        email: 'staff@test.local',
        role: UserRole.STAFF,
      },
    });
  });

  it('lets STAFF with audit_log_view list audit logs', async () => {
    mocks.audit.getAuditLogs.mockResolvedValue({
      data: [{ id: 1, action: 'CREATE_STAFF' }],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });

    const response = await request(app.getHttpServer())
      .get('/admin/audit-logs')
      .set('x-test-user-id', '2')
      .set('x-test-role', 'STAFF')
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      meta: { total: 1 },
    });
    expect(mocks.audit.getAuditLogs).toHaveBeenCalled();
  });

  it('lets STAFF with audit_log_view export audit logs as CSV', async () => {
    mocks.audit.exportAuditLogsCsv.mockResolvedValue(
      'id,createdAt,actorEmail\n1,2026-01-01T00:00:00.000Z,admin@test.local',
    );

    const response = await request(app.getHttpServer())
      .get('/admin/audit-logs/export')
      .set('x-test-user-id', '2')
      .set('x-test-role', 'STAFF')
      .expect(200);

    expect(response.headers['content-type']).toContain('text/csv');
    expect(response.text).toContain('actorEmail');
    expect(mocks.audit.exportAuditLogsCsv).toHaveBeenCalled();
  });

  it('rejects STAFF without audit_log_view from audit logs', async () => {
    await request(app.getHttpServer())
      .get('/admin/audit-logs')
      .set('x-test-user-id', '3')
      .set('x-test-role', 'STAFF')
      .expect(403);
    expect(mocks.audit.getAuditLogs).not.toHaveBeenCalled();
  });

  it('lets STAFF with staff_view list permissions and staffs', async () => {
    mocks.staff.getStaffs.mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });

    const permissionsResponse = await request(app.getHttpServer())
      .get('/admin/permissions')
      .set('x-test-user-id', '5')
      .set('x-test-role', 'STAFF')
      .expect(200);

    const permissionsBody =
      permissionsResponse.body as PermissionMatrixResponse;
    expect(permissionsBody.success).toBe(true);
    expect(
      permissionsBody.data.some(
        (group) =>
          group.group === 'Nhân viên' && Array.isArray(group.permissions),
      ),
    ).toBe(true);

    await request(app.getHttpServer())
      .get('/admin/staffs')
      .set('x-test-user-id', '5')
      .set('x-test-role', 'STAFF')
      .expect(200);
  });

  it('rejects STAFF without staff_manage from creating staff', async () => {
    await request(app.getHttpServer())
      .post('/admin/staffs')
      .set('x-test-user-id', '5')
      .set('x-test-role', 'STAFF')
      .send({
        fullName: 'No Manage',
        email: 'no-manage@test.local',
        password: 'Password123!',
      })
      .expect(403);
    expect(mocks.staff.createStaff).not.toHaveBeenCalled();
  });

  it('allows wallet deposit and service moderation permissions separately', async () => {
    mocks.deposit.adminListManualDepositRequests.mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });
    mocks.moderation.getAll.mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });

    await request(app.getHttpServer())
      .get('/admin/wallet-deposits')
      .set('x-test-user-id', '6')
      .set('x-test-role', 'STAFF')
      .expect(200);
    await request(app.getHttpServer())
      .get('/admin/services')
      .set('x-test-user-id', '7')
      .set('x-test-role', 'STAFF')
      .expect(200);
  });

  it('rejects wallet deposit and service moderation without permissions', async () => {
    await request(app.getHttpServer())
      .get('/admin/wallet-deposits')
      .set('x-test-user-id', '3')
      .set('x-test-role', 'STAFF')
      .expect(403);
    await request(app.getHttpServer())
      .get('/admin/services')
      .set('x-test-user-id', '3')
      .set('x-test-role', 'STAFF')
      .expect(403);
  });

  it('allows booking_view but rejects booking_cancel without permission', async () => {
    mocks.admin.getBookings.mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });

    await request(app.getHttpServer())
      .get('/admin/bookings')
      .set('x-test-user-id', '4')
      .set('x-test-role', 'STAFF')
      .expect(200);

    await request(app.getHttpServer())
      .patch('/admin/bookings/10/cancel')
      .set('x-test-user-id', '4')
      .set('x-test-role', 'STAFF')
      .send({ reason: 'test' })
      .expect(403);
    expect(mocks.admin.cancelBooking).not.toHaveBeenCalled();
  });
});

function createMocks(): AdminMocks {
  return {
    admin: {
      getBookings: mockAsync(),
      cancelBooking: mockAsync(),
    },
    staff: {
      createStaff: mockAsync(),
      getStaffs: mockAsync(),
    },
    audit: {
      getAuditLogs: mockAsync(),
      exportAuditLogsCsv: mockAsync(),
    },
    deposit: {
      adminListManualDepositRequests: mockAsync(),
    },
    moderation: {
      getAll: mockAsync(),
    },
    bookingQuery: {
      getTimelineForAdmin: mockAsync(),
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
