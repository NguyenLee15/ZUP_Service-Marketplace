import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface PublicSocialConfig {
  enabled: boolean;
  zalo: {
    phone?: string;
    oaId?: string;
    chatUrl?: string;
  };
  facebook: {
    pageUrl?: string;
  };
  tiktok: {
    profileUrl?: string;
    videoUrl?: string;
  };
}

const SOCIAL_KEYS = [
  'social.enabled',
  'social.zalo.phone',
  'social.zalo.oaId',
  'social.zalo.chatUrl',
  'social.facebook.pageUrl',
  'social.tiktok.profileUrl',
  'social.tiktok.videoUrl',
] as const;

export interface SocialSettingsAuditContext {
  adminId: number;
  ip?: string;
}

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async getPublicSocialConfig(): Promise<PublicSocialConfig> {
    const values = await this.getSocialValues();
    return {
      enabled: this.booleanValue(values['social.enabled'], true),
      zalo: {
        phone: values['social.zalo.phone'],
        oaId: values['social.zalo.oaId'],
        chatUrl: values['social.zalo.chatUrl'],
      },
      facebook: {
        pageUrl: values['social.facebook.pageUrl'],
      },
      tiktok: {
        profileUrl: values['social.tiktok.profileUrl'],
        videoUrl: values['social.tiktok.videoUrl'],
      },
    };
  }

  async updatePublicSocialConfig(
    input: Partial<PublicSocialConfig>,
    auditContext?: SocialSettingsAuditContext,
  ) {
    const entries: Array<{ key: string; value: string }> = [];

    if (typeof input.enabled === 'boolean') {
      entries.push({ key: 'social.enabled', value: String(input.enabled) });
    }
    if (input.zalo?.phone !== undefined) {
      entries.push({ key: 'social.zalo.phone', value: input.zalo.phone || '' });
    }
    if (input.zalo?.oaId !== undefined) {
      entries.push({ key: 'social.zalo.oaId', value: input.zalo.oaId || '' });
    }
    if (input.zalo?.chatUrl !== undefined) {
      entries.push({
        key: 'social.zalo.chatUrl',
        value: input.zalo.chatUrl || '',
      });
    }
    if (input.facebook?.pageUrl !== undefined) {
      entries.push({
        key: 'social.facebook.pageUrl',
        value: input.facebook.pageUrl || '',
      });
    }
    if (input.tiktok?.profileUrl !== undefined) {
      entries.push({
        key: 'social.tiktok.profileUrl',
        value: input.tiktok.profileUrl || '',
      });
    }
    if (input.tiktok?.videoUrl !== undefined) {
      entries.push({
        key: 'social.tiktok.videoUrl',
        value: input.tiktok.videoUrl || '',
      });
    }

    if (entries.length > 0) {
      await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await Promise.all(
          entries.map((entry) =>
            tx.systemSetting.upsert({
              where: { key: entry.key },
              create: entry,
              update: { value: entry.value },
            }),
          ),
        );

        if (auditContext) {
          await tx.auditLog.create({
            data: {
              actorId: auditContext.adminId,
              action: 'UPDATE_SOCIAL_SETTINGS',
              targetType: 'SYSTEM_SETTING',
              targetId: 0,
              description: `Cập nhật cấu hình mạng xã hội: ${entries
                .map((entry) => entry.key.replace('social.', ''))
                .join(', ')}`,
              ipAddress: auditContext.ip,
            },
          });
        }
      });
    }

    return this.getPublicSocialConfig();
  }

  private async getSocialValues() {
    const rows = await this.prisma.systemSetting.findMany({
      where: { key: { in: [...SOCIAL_KEYS] } },
    });
    const dbValues = Object.fromEntries(
      rows.map((row) => [row.key, row.value]),
    );
    return {
      'social.enabled':
        dbValues['social.enabled'] ||
        this.configService.get<string>('SOCIAL_ENABLED') ||
        'true',
      'social.zalo.phone':
        dbValues['social.zalo.phone'] ||
        this.configService.get<string>('SOCIAL_ZALO_PHONE') ||
        '19001234',
      'social.zalo.oaId':
        dbValues['social.zalo.oaId'] ||
        this.configService.get<string>('SOCIAL_ZALO_OA_ID') ||
        '',
      'social.zalo.chatUrl':
        dbValues['social.zalo.chatUrl'] ||
        this.configService.get<string>('SOCIAL_ZALO_CHAT_URL') ||
        '',
      'social.facebook.pageUrl':
        dbValues['social.facebook.pageUrl'] ||
        this.configService.get<string>('SOCIAL_FACEBOOK_PAGE_URL') ||
        'https://www.facebook.com/facebook',
      'social.tiktok.profileUrl':
        dbValues['social.tiktok.profileUrl'] ||
        this.configService.get<string>('SOCIAL_TIKTOK_PROFILE_URL') ||
        'https://www.tiktok.com/@tiktok',
      'social.tiktok.videoUrl':
        dbValues['social.tiktok.videoUrl'] ||
        this.configService.get<string>('SOCIAL_TIKTOK_VIDEO_URL') ||
        '',
    };
  }

  private booleanValue(value: string | undefined, fallback: boolean) {
    if (value === undefined) return fallback;
    return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
  }
}
