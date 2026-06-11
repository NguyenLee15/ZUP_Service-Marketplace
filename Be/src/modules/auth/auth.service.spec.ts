import {
  BadRequestException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { JobsService } from '../../shared/jobs/jobs.service';
import { hashToken } from '../../common/utils/token-hash.util';
import { AuthService } from './auth.service';

jest.mock('../../common/utils/hash.util', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed-password'),
  comparePassword: jest.fn(),
}));

type RefreshTokenRecord = {
  id: number;
  userId: number;
  token: string;
  tokenHash: string | null;
  revoked: boolean;
  expiresAt: Date;
  user: {
    id: number;
    email: string;
    role: UserRole;
  };
};

type PasswordResetRecord = {
  id: number;
  userId: number;
  token: string;
  tokenHash: string | null;
  used: boolean;
  expiresAt: Date;
};

type GoogleUserRecord = {
  id: number;
  email: string;
  fullName: string | null;
  password?: string | null;
  avatarUrl: string | null;
  googleId: string | null;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
};

type AuthPrismaMock = {
  refreshToken: {
    findFirst: jest.Mock<Promise<RefreshTokenRecord | null>, unknown[]>;
    update: jest.Mock;
    updateMany: jest.Mock;
    create: jest.Mock;
  };
  passwordReset: {
    findFirst: jest.Mock<Promise<PasswordResetRecord | null>, unknown[]>;
    create: jest.Mock;
    update: jest.Mock;
  };
  user: {
    findUnique: jest.Mock;
    findFirst: jest.Mock<Promise<GoogleUserRecord | null>, unknown[]>;
    create: jest.Mock<Promise<GoogleUserRecord>, unknown[]>;
    update: jest.Mock;
  };
  $transaction: jest.Mock;
};

type RefreshTokenCreateArg = {
  data: {
    userId: number;
    token: string;
    tokenHash?: string | null;
  };
};

type PasswordResetCreateArg = {
  data: {
    userId: number;
    token: string;
    tokenHash?: string | null;
  };
};

type TransactionCallback = (tx: AuthPrismaMock) => Promise<unknown>;

type GooglePayload = {
  email?: string;
  name?: string;
  picture?: string;
  sub: string;
};

describe('AuthService token hardening', () => {
  let service: AuthService;
  let prisma: AuthPrismaMock;

  beforeEach(() => {
    prisma = {
      refreshToken: {
        findFirst: jest.fn<Promise<RefreshTokenRecord | null>, unknown[]>(),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn().mockResolvedValue({ id: 2 }),
      },
      passwordReset: {
        findFirst: jest.fn<Promise<PasswordResetRecord | null>, unknown[]>(),
        create: jest.fn().mockResolvedValue({ id: 1 }),
        update: jest.fn().mockResolvedValue({}),
      },
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn<Promise<GoogleUserRecord | null>, unknown[]>(),
        create: jest.fn<Promise<GoogleUserRecord>, unknown[]>(),
        update: jest.fn().mockResolvedValue({}),
      },
      $transaction: jest.fn<Promise<unknown>, [unknown]>((input) => {
        if (isTransactionCallback(input)) {
          return input(prisma);
        }
        return Promise.all(input as Promise<unknown>[]);
      }),
    };

    service = new AuthService(
      prisma as unknown as PrismaService,
      {
        sign: jest.fn().mockReturnValue('access-token'),
      } as unknown as JwtService,
      {
        get: jest.fn((key: string) => {
          const values: Record<string, string> = {
            'app.jwtSecret': 'test-secret',
            'app.jwtExpiresIn': '30m',
            'app.jwtRefreshExpiresIn': '7d',
            'app.frontendUrl': 'https://fe.test',
          };
          return values[key];
        }),
        getOrThrow: jest.fn().mockReturnValue('test-secret'),
      } as unknown as ConfigService,
      { enqueue: jest.fn() } as unknown as JobsService,
    );
  });

  it('rotates a valid hashed refresh token and stores only the new hash', async () => {
    prisma.refreshToken.findFirst.mockResolvedValue(
      refreshRecord({ tokenHash: hashToken('raw-refresh') }),
    );

    const result = await service.refreshToken('raw-refresh');

    expect(result.data.accessToken).toBe('access-token');
    expect(prisma.refreshToken.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [{ tokenHash: hashToken('raw-refresh') }, { token: 'raw-refresh' }],
      },
      include: { user: true },
    });
    expect(prisma.refreshToken.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { revoked: true },
    });
    const createArg = firstCallArg<RefreshTokenCreateArg>(
      prisma.refreshToken.create as jest.Mock<unknown, [RefreshTokenCreateArg]>,
    );
    expect(createArg.data.userId).toBe(10);
    expect(createArg.data.token).toBe('');
    expect(typeof createArg.data.tokenHash).toBe('string');
  });

  it('revokes all active sessions when a refresh token is reused', async () => {
    prisma.refreshToken.findFirst.mockResolvedValue(
      refreshRecord({ revoked: true, tokenHash: hashToken('reused') }),
    );

    await expect(service.refreshToken('reused')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: 10, revoked: false },
      data: { revoked: true },
    });
    expect(prisma.refreshToken.create).not.toHaveBeenCalled();
  });

  it('rejects expired refresh tokens without rotating them', async () => {
    prisma.refreshToken.findFirst.mockResolvedValue(
      refreshRecord({ expiresAt: new Date(Date.now() - 1000) }),
    );

    await expect(service.refreshToken('expired')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(prisma.refreshToken.update).not.toHaveBeenCalled();
    expect(prisma.refreshToken.create).not.toHaveBeenCalled();
  });

  it('keeps legacy raw refresh token fallback until expiry', async () => {
    prisma.refreshToken.findFirst.mockResolvedValue(
      refreshRecord({ token: 'legacy-refresh', tokenHash: null }),
    );

    await service.refreshToken('legacy-refresh');

    expect(prisma.refreshToken.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [
          { tokenHash: hashToken('legacy-refresh') },
          { token: 'legacy-refresh' },
        ],
      },
      include: { user: true },
    });
  });

  it('stores password reset tokens as hashes only', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 10, email: 'a@test.local' });
    prisma.passwordReset.findFirst.mockResolvedValue(null);

    await service.forgotPassword({ email: 'a@test.local' });

    const createArg = firstCallArg<PasswordResetCreateArg>(
      prisma.passwordReset.create as jest.Mock<
        unknown,
        [PasswordResetCreateArg]
      >,
    );
    expect(createArg.data.userId).toBe(10);
    expect(createArg.data.token).toBe('');
    expect(typeof createArg.data.tokenHash).toBe('string');
  });

  it('resets password with a hashed reset token and revokes refresh tokens', async () => {
    prisma.passwordReset.findFirst.mockResolvedValue(
      passwordResetRecord({ tokenHash: hashToken('reset-token') }),
    );

    await service.resetPassword({
      token: 'reset-token',
      newPassword: 'Password123!',
    });

    expect(prisma.passwordReset.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [{ tokenHash: hashToken('reset-token') }, { token: 'reset-token' }],
      },
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { password: 'hashed-password' },
    });
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: 10, revoked: false },
      data: { revoked: true },
    });
  });

  it('rejects reused or expired reset tokens', async () => {
    prisma.passwordReset.findFirst.mockResolvedValue(
      passwordResetRecord({ used: true }),
    );

    await expect(
      service.resetPassword({ token: 'used', newPassword: 'Password123!' }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(prisma.passwordReset.update).not.toHaveBeenCalled();
  });

  it('keeps legacy raw password reset token fallback until expiry', async () => {
    prisma.passwordReset.findFirst.mockResolvedValue(
      passwordResetRecord({ token: 'legacy-reset', tokenHash: null }),
    );

    await service.resetPassword({
      token: 'legacy-reset',
      newPassword: 'Password123!',
    });

    expect(prisma.passwordReset.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [
          { tokenHash: hashToken('legacy-reset') },
          { token: 'legacy-reset' },
        ],
      },
    });
  });

  it('treats Google login for privileged email as a customer account', async () => {
    prisma.user.findFirst.mockResolvedValue(
      googleUserRecord({
        email: 'admin@test.local',
        role: UserRole.ADMIN,
      }),
    );
    prisma.user.update.mockResolvedValue(
      googleUserRecord({
        email: 'admin@test.local',
        googleId: 'google-admin-sub',
        role: UserRole.CUSTOMER,
      }),
    );
    mockGooglePayload(service, {
      email: 'admin@test.local',
      name: 'Admin User',
      picture: 'https://avatar.test/admin.png',
      sub: 'google-admin-sub',
    });

    const result = await service.googleLogin('google-credential');

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        googleId: 'google-admin-sub',
        avatarUrl: 'https://avatar.test/admin.png',
        role: UserRole.CUSTOMER,
      },
    });
    expect(result.data.user.role).toBe(UserRole.CUSTOMER);
    expect(prisma.refreshToken.create).toHaveBeenCalled();
  });

  it('logs provider in with Google when a provider account already exists', async () => {
    prisma.user.findFirst.mockResolvedValue(
      googleUserRecord({
        email: 'provider@test.local',
        role: UserRole.PROVIDER,
      }),
    );
    prisma.user.update.mockResolvedValue(
      googleUserRecord({
        email: 'provider@test.local',
        googleId: 'google-provider-sub',
        role: UserRole.PROVIDER,
      }),
    );
    mockGooglePayload(service, {
      email: 'provider@test.local',
      name: 'Provider User',
      picture: 'https://avatar.test/provider.png',
      sub: 'google-provider-sub',
    });

    const result = await service.providerGoogleLogin('google-credential');

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        googleId: 'google-provider-sub',
        avatarUrl: 'https://avatar.test/provider.png',
      },
    });
    expect(result.data.user.role).toBe(UserRole.PROVIDER);
    expect(prisma.refreshToken.create).toHaveBeenCalled();
  });

  it('rejects provider Google login when the matched account is not a provider', async () => {
    const loggerErrorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation();
    prisma.user.findFirst.mockResolvedValue(
      googleUserRecord({
        email: 'customer@test.local',
        role: UserRole.CUSTOMER,
      }),
    );
    mockGooglePayload(service, {
      email: 'customer@test.local',
      name: 'Customer User',
      picture: 'https://avatar.test/customer.png',
      sub: 'google-customer-sub',
    });

    try {
      await service.providerGoogleLogin('google-credential');
      throw new Error('Expected provider Google login to fail');
    } catch (err) {
      expect(err).toBeInstanceOf(UnauthorizedException);
      expect((err as UnauthorizedException).getResponse()).toMatchObject({
        message:
          'Vui lòng đăng ký tài khoản thợ bằng email trước khi dùng Google.',
      });
    }

    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(prisma.refreshToken.create).not.toHaveBeenCalled();
    loggerErrorSpy.mockRestore();
  });
});

function refreshRecord(
  overrides: Partial<RefreshTokenRecord> = {},
): RefreshTokenRecord {
  return {
    id: 1,
    userId: 10,
    token: '',
    tokenHash: hashToken('raw-refresh'),
    revoked: false,
    expiresAt: new Date(Date.now() + 60_000),
    user: {
      id: 10,
      email: 'user@test.local',
      role: UserRole.CUSTOMER,
    },
    ...overrides,
  };
}

function passwordResetRecord(
  overrides: Partial<PasswordResetRecord> = {},
): PasswordResetRecord {
  return {
    id: 1,
    userId: 10,
    token: '',
    tokenHash: hashToken('reset-token'),
    used: false,
    expiresAt: new Date(Date.now() + 60_000),
    ...overrides,
  };
}

function googleUserRecord(
  overrides: Partial<GoogleUserRecord> = {},
): GoogleUserRecord {
  return {
    id: 1,
    email: 'user@test.local',
    fullName: 'Test User',
    password: null,
    avatarUrl: null,
    googleId: null,
    role: UserRole.CUSTOMER,
    status: UserStatus.ACTIVE,
    emailVerified: true,
    ...overrides,
  };
}

function mockGooglePayload(service: AuthService, payload: GooglePayload): void {
  (
    service as unknown as {
      googleClient: {
        verifyIdToken: jest.Mock;
      };
    }
  ).googleClient = {
    verifyIdToken: jest.fn().mockResolvedValue({
      getPayload: () => payload,
    }),
  };
}

function isTransactionCallback(value: unknown): value is TransactionCallback {
  return typeof value === 'function';
}

function firstCallArg<T>(mock: jest.Mock<unknown, [T]>): T {
  const call = mock.mock.calls[0];
  if (!call) throw new Error('Expected mock to be called');
  return call[0];
}
