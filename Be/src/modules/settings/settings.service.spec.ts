import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../../prisma/prisma.service';
import {
  SocialFacebookConfigDto,
  UpdateSocialConfigDto,
} from '../admin/dto/admin.dto';
import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  it('audits social settings updates in the same transaction', async () => {
    const prisma = {
      $transaction: jest.fn(),
      systemSetting: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    const transaction = {
      systemSetting: {
        upsert: jest.fn().mockResolvedValue(undefined),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue(undefined),
      },
    };
    prisma.$transaction.mockImplementation(async (callback) =>
      callback(transaction),
    );
    const service = new SettingsService(
      prisma as unknown as PrismaService,
      { get: jest.fn() } as never,
    );

    await service.updatePublicSocialConfig(
      {
        enabled: true,
        facebook: { pageUrl: 'https://facebook.com/example' },
      },
      { adminId: 7, ip: '127.0.0.1' },
    );

    expect(transaction.systemSetting.upsert).toHaveBeenCalled();
    expect(transaction.auditLog.create).toHaveBeenCalledWith({
      data: {
        actorId: 7,
        action: 'UPDATE_SOCIAL_SETTINGS',
        targetType: 'SYSTEM_SETTING',
        targetId: 0,
        description: 'Cập nhật cấu hình mạng xã hội: enabled, facebook.pageUrl',
        ipAddress: '127.0.0.1',
      },
    });
  });

  it('does not write settings or audit log when the transaction fails', async () => {
    const prisma = {
      $transaction: jest.fn().mockRejectedValue(new Error('db unavailable')),
      systemSetting: { findMany: jest.fn() },
    };
    const service = new SettingsService(
      prisma as unknown as PrismaService,
      { get: jest.fn() } as never,
    );

    await expect(
      service.updatePublicSocialConfig(
        { facebook: { pageUrl: 'https://facebook.com/example' } },
        { adminId: 7, ip: '127.0.0.1' },
      ),
    ).rejects.toThrow('db unavailable');
    expect(prisma.systemSetting.findMany).not.toHaveBeenCalled();
  });

  it('rejects malformed social URLs at the DTO boundary', async () => {
    const dto = plainToInstance(UpdateSocialConfigDto, {
      facebook: { pageUrl: 'not-a-url' },
    });
    const facebook = dto.facebook as SocialFacebookConfigDto;
    const errors = await validate(facebook);

    expect(facebook.pageUrl).toBe('not-a-url');
    expect(
      errors.flatMap((error) => Object.keys(error.constraints ?? {})),
    ).toContain('isUrl');
  });
});
