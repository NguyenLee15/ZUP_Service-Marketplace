import { UserRole } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AdminAuditLogService } from './admin-audit-log.service';

describe('AdminAuditLogService', () => {
  let prisma: {
    auditLog: {
      findMany: jest.Mock<Promise<unknown[]>, [unknown]>;
      count: jest.Mock<Promise<number>, [unknown]>;
    };
  };
  let service: AdminAuditLogService;

  beforeEach(() => {
    prisma = {
      auditLog: {
        findMany: jest.fn<Promise<unknown[]>, [unknown]>(),
        count: jest.fn<Promise<number>, [unknown]>(),
      },
    };
    service = new AdminAuditLogService(prisma as unknown as PrismaService);
  });

  it('returns audit logs with actor info and pagination meta', async () => {
    prisma.auditLog.findMany.mockResolvedValue([
      {
        id: 1,
        action: 'CREATE_STAFF',
        targetType: 'USER',
        targetId: 2,
        actor: {
          id: 1,
          email: 'admin@test.local',
          fullName: 'Admin',
          role: UserRole.ADMIN,
        },
      },
    ]);
    prisma.auditLog.count.mockResolvedValue(1);

    const result = await service.getAuditLogs({
      page: 2,
      limit: 10,
      action: 'CREATE_STAFF',
      targetType: 'USER',
      targetId: 2,
      actorId: 1,
      keyword: 'admin',
      from: '2026-01-01',
      to: '2026-01-31',
    });

    expect(result.meta).toEqual({
      page: 2,
      limit: 10,
      total: 1,
      totalPages: 1,
    });
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: {
          actor: {
            select: {
              id: true,
              email: true,
              fullName: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: 10,
        take: 10,
      }),
    );
    const countArg = prisma.auditLog.count.mock.calls[0]?.[0] as {
      where?: {
        actorId?: number;
        targetId?: number;
        action?: string;
        targetType?: string;
        OR?: unknown;
      };
    };
    expect(countArg.where?.actorId).toBe(1);
    expect(countArg.where?.targetId).toBe(2);
    expect(countArg.where?.action).toBe('CREATE_STAFF');
    expect(countArg.where?.targetType).toBe('USER');
    expect(Array.isArray(countArg.where?.OR)).toBe(true);
  });

  it('streams filtered audit logs as escaped CSV in bounded batches', async () => {
    prisma.auditLog.findMany.mockResolvedValue([
      {
        id: 1,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        actor: {
          email: 'admin@test.local',
          fullName: 'Admin, Root',
          role: UserRole.ADMIN,
        },
        action: 'UPDATE_STAFF',
        targetType: 'USER',
        targetId: 2,
        ipAddress: '127.0.0.1',
        description: 'permissions(2)="audit_log_view"',
      },
    ]);

    prisma.auditLog.count.mockResolvedValue(1);
    const chunks: string[] = [];
    for await (const chunk of service.streamAuditLogsCsv({
      page: 1,
      limit: 20,
      keyword: 'staff',
    })) {
      chunks.push(chunk);
    }
    const csv = chunks.join('');

    expect(csv).toContain(
      'id,createdAt,actorEmail,actorName,actorRole,action,targetType,targetId,ipAddress,description',
    );
    expect(csv).toContain('"Admin, Root"');
    expect(csv).toContain('"permissions(2)=""audit_log_view"""');
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 500,
      }),
    );
  });
});
