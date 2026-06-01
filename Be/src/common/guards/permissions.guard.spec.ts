import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { AdminPermission } from '../constants/admin-permissions';
import { AuthenticatedRequest } from '../types/auth.types';
import { PermissionsGuard } from './permissions.guard';
import { PrismaService } from '../../prisma/prisma.service';

describe('PermissionsGuard', () => {
  let reflector: jest.Mocked<Pick<Reflector, 'getAllAndOverride'>>;
  let prisma: {
    user: {
      findUnique: jest.Mock;
    };
  };
  let guard: PermissionsGuard;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    };
    prisma = {
      user: {
        findUnique: jest.fn(),
      },
    };
    guard = new PermissionsGuard(
      reflector as unknown as Reflector,
      prisma as unknown as PrismaService,
    );
  });

  it('allows endpoints without required permissions', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    await expect(
      guard.canActivate(createContext(UserRole.CUSTOMER)),
    ).resolves.toBe(true);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('allows ADMIN without database permission lookup', async () => {
    reflector.getAllAndOverride.mockReturnValue([
      AdminPermission.AUDIT_LOG_VIEW,
    ]);

    await expect(
      guard.canActivate(createContext(UserRole.ADMIN)),
    ).resolves.toBe(true);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('allows STAFF with at least one required permission', async () => {
    reflector.getAllAndOverride.mockReturnValue([
      AdminPermission.AUDIT_LOG_VIEW,
    ]);
    prisma.user.findUnique.mockResolvedValue({
      permissions: [AdminPermission.AUDIT_LOG_VIEW],
    });

    await expect(
      guard.canActivate(createContext(UserRole.STAFF)),
    ).resolves.toBe(true);
  });

  it('rejects STAFF without required permission', async () => {
    reflector.getAllAndOverride.mockReturnValue([
      AdminPermission.BOOKING_CANCEL,
    ]);
    prisma.user.findUnique.mockResolvedValue({
      permissions: [AdminPermission.BOOKING_VIEW],
    });

    await expect(
      guard.canActivate(createContext(UserRole.STAFF)),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects non-staff roles for permission-protected endpoints', async () => {
    reflector.getAllAndOverride.mockReturnValue([
      AdminPermission.AUDIT_LOG_VIEW,
    ]);

    await expect(
      guard.canActivate(createContext(UserRole.CUSTOMER)),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

function createContext(role: UserRole): ExecutionContext {
  const request: AuthenticatedRequest = {
    user: {
      id: 10,
      email: 'user@test.local',
      role,
    },
  } as AuthenticatedRequest;

  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn(() => ({
      getRequest: jest.fn(() => request),
    })),
  } as unknown as ExecutionContext;
}
