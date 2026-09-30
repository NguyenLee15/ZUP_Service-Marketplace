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
  needsPasswordRehash: jest.fn(),
}));

type RefreshTokenRecord = {
  id: number;
  userId: number;
  tokenHash: string;
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
  tokenHash: string;
  used: boolean;
  expiresAt: Date;
};

type OtpRecord = {
  id: number;
  code: string | null;
  codeHash: string | null;
  wrongAttempts: number;
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
    updateMany: jest.Mock;
  };
  otpAttempt: {
    findFirst: jest.Mock;
    update: jest.Mock;
  };
  user: {
    findUnique: jest.Mock;
    findFirst: jest.Mock<Promise<GoogleUserRecord | null>, unknown[]>;
    create: jest.Mock<Promise<GoogleUserRecord>, unknown[]>;
    update: jest.Mock;
  };
  loginAttempt: {
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    deleteMany: jest.Mock;
  };
  $transaction: jest.Mock;
};

type RefreshTokenCreateArg = {
  data: {
    userId: number;
    tokenHash: string;
  };
};

type PasswordResetCreateArg = {
  data: {
    userId: number;
    tokenHash: string;
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
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      otpAttempt: {
        findFirst: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn<Promise<GoogleUserRecord | null>, unknown[]>(),
        create: jest.fn<Promise<GoogleUserRecord>, unknown[]>(),
        update: jest.fn().mockResolvedValue({}),
      },
      loginAttempt: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
        delete: jest.fn().mockResolvedValue({}),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      $transaction: jest.fn<Promise<unknown>, [unknown]>((input) => {
        if (isTransactionCallback(input)) {
          return input(prisma);
        }
        return Promise.all(input as Promise<unknown>[]);
      }),
    };

    const hash = jest.requireMock('../../common/utils/hash.util');
    hash.comparePassword.mockReset();
    hash.comparePassword.mockResolvedValue(false);
    hash.needsPasswordRehash.mockReset();
    hash.needsPasswordRehash.mockReturnValue(false);
    hash.hashPassword.mockReset();
    hash.hashPassword.mockResolvedValue('hashed-password');

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
      where: { tokenHash: hashToken('raw-refresh') },
      include: { user: true },
    });
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { id: 1, revoked: false },
      data: { revoked: true },
    });
    const createArg = firstCallArg<RefreshTokenCreateArg>(
      prisma.refreshToken.create as jest.Mock<unknown, [RefreshTokenCreateArg]>,
    );
    expect(createArg.data.userId).toBe(10);
    expect(typeof createArg.data.tokenHash).toBe('string');
  });

  it('rehashes a valid low-cost password after successful login', async () => {
    const hash = jest.requireMock('../../common/utils/hash.util');
    hash.comparePassword.mockResolvedValue(true);
    hash.needsPasswordRehash.mockReturnValue(true);
    hash.hashPassword.mockResolvedValue('rehash-at-12');
    prisma.user.findUnique.mockResolvedValue({
      id: 10,
      email: 'user@test.local',
      password: 'old-hash',
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    });

    await service.login({ email: 'user@test.local', password: 'secret' });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { password: 'rehash-at-12' },
    });
  });

  it('masks user email in successful login logs', async () => {
    const hash = jest.requireMock('../../common/utils/hash.util');
    hash.comparePassword.mockResolvedValue(true);
    hash.needsPasswordRehash.mockReturnValue(false);
    prisma.user.findUnique.mockResolvedValue({
      id: 10,
      email: 'user@example.com',
      password: 'hash',
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    });
    const logSpy = jest.spyOn(Logger.prototype, 'log');

    await service.login({ email: 'user@example.com', password: 'secret' });

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('u***@example.com'),
    );
    expect(logSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('user@example.com'),
    );
    logSpy.mockRestore();
  });

  it('masks malformed emails without throwing', () => {
    const maskEmail = (
      service as unknown as { maskEmail: (email: string) => string }
    ).maskEmail;

    expect(maskEmail.call(service, 'invalid')).toBe('***');
  });

  it('rejects when refresh token CAS loses a concurrent rotation', async () => {
    prisma.refreshToken.findFirst.mockResolvedValue(
      refreshRecord({ tokenHash: hashToken('concurrent-refresh') }),
    );
    prisma.refreshToken.updateMany.mockResolvedValueOnce({ count: 0 });

    await expect(service.refreshToken('concurrent-refresh')).rejects.toThrow(
      'Refresh token đã bị thu hồi hoặc phát hiện sử dụng lại',
    );
    expect(prisma.refreshToken.create).not.toHaveBeenCalled();
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

  it('rejects refresh tokens that have no persisted hash', async () => {
    prisma.refreshToken.findFirst.mockResolvedValue(null);

    await expect(service.refreshToken('legacy-refresh')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(prisma.refreshToken.findFirst).toHaveBeenCalledWith({
      where: { tokenHash: hashToken('legacy-refresh') },
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
      where: { tokenHash: hashToken('reset-token') },
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

  it('does not update the password when a concurrent reset claim wins', async () => {
    prisma.passwordReset.findFirst.mockResolvedValue(
      passwordResetRecord({ used: false }),
    );
    prisma.passwordReset.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.resetPassword({
        token: 'concurrent',
        newPassword: 'Password123!',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.passwordReset.updateMany).toHaveBeenCalledWith({
      where: {
        id: 1,
        used: false,
        expiresAt: { gt: expect.any(Date) },
      },
      data: { used: true },
    });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('rejects password reset tokens that have no persisted hash', async () => {
    prisma.passwordReset.findFirst.mockResolvedValue(null);

    await expect(
      service.resetPassword({
        token: 'legacy-reset',
        newPassword: 'Password123!',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.passwordReset.findFirst).toHaveBeenCalledWith({
      where: { tokenHash: hashToken('legacy-reset') },
    });
  });

  it('rejects legacy raw-only OTP rows instead of comparing the raw code', async () => {
    const otp: OtpRecord = {
      id: 1,
      code: '123456',
      codeHash: null,
      wrongAttempts: 0,
    };
    prisma.otpAttempt.findFirst.mockResolvedValue(otp);

    await expect(
      service.verifyOtp({ email: 'user@test.local', otp: '123456' }),
    ).rejects.toMatchObject({
      response: { code: 'OTP_INVALID' },
    });
    expect(prisma.user.update).not.toHaveBeenCalled();
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

  it('rejects provider Google login when email is not a provider account', async () => {
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

    await expect(
      service.providerGoogleLogin('google-credential'),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(prisma.refreshToken.create).not.toHaveBeenCalled();
    loggerErrorSpy.mockRestore();
  });

  it('links and logs in an existing provider through provider Google login', async () => {
    const loggerLogSpy = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation();
    const provider = googleUserRecord({
      email: 'provider@test.local',
      role: UserRole.PROVIDER,
      googleId: null,
    });
    prisma.user.findFirst.mockResolvedValue(provider);
    prisma.user.update.mockResolvedValue({
      ...provider,
      googleId: 'google-provider-sub',
      avatarUrl: 'https://avatar.test/provider.png',
    });
    mockGooglePayload(service, {
      email: 'provider@test.local',
      name: 'Provider User',
      picture: 'https://avatar.test/provider.png',
      sub: 'google-provider-sub',
    });

    const result = await service.providerGoogleLogin('google-credential');

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: provider.id },
      data: {
        googleId: 'google-provider-sub',
        avatarUrl: 'https://avatar.test/provider.png',
      },
    });
    expect(result.data.user.role).toBe(UserRole.PROVIDER);
    expect(result.data.accessToken).toBe('access-token');
    expect(loggerLogSpy).toHaveBeenCalledWith(
      'Linked Google account to provider: p***@test.local',
    );
    expect(loggerLogSpy).not.toHaveBeenCalledWith(
      'Linked Google account to provider: provider@test.local',
    );
    loggerLogSpy.mockRestore();
  });
});

function refreshRecord(
  overrides: Partial<RefreshTokenRecord> = {},
): RefreshTokenRecord {
  return {
    id: 1,
    userId: 10,
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
