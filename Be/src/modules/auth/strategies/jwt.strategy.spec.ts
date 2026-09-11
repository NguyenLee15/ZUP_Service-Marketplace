import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../../../prisma/prisma.service';
import { ErrorCodes } from '../../../common/errors/error-codes';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prisma: { user: { findUnique: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('test-jwt-secret'),
          },
        },
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('should validate and return active user payload', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      email: 'user@test.com',
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
    });

    const result = await strategy.validate({
      sub: 1,
      email: 'user@test.com',
      role: UserRole.CUSTOMER,
    });

    expect(result).toEqual({
      id: 1,
      email: 'user@test.com',
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
    });
  });

  it('should throw ForbiddenException if user status is LOCKED', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 2,
      email: 'locked@test.com',
      role: UserRole.CUSTOMER,
      status: UserStatus.LOCKED,
    });

    await expect(
      strategy.validate({
        sub: 2,
        email: 'locked@test.com',
        role: UserRole.CUSTOMER,
      }),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      strategy.validate({
        sub: 2,
        email: 'locked@test.com',
        role: UserRole.CUSTOMER,
      }),
    ).rejects.toMatchObject({
      response: {
        code: ErrorCodes.ACCOUNT_LOCKED,
      },
    });
  });

  it('should throw ForbiddenException if user status is PENDING', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 3,
      email: 'pending@test.com',
      role: UserRole.CUSTOMER,
      status: UserStatus.PENDING,
    });

    await expect(
      strategy.validate({
        sub: 3,
        email: 'pending@test.com',
        role: UserRole.CUSTOMER,
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw UnauthorizedException if user is not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      strategy.validate({
        sub: 999,
        email: 'ghost@test.com',
        role: UserRole.CUSTOMER,
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
