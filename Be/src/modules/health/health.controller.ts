import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../shared/redis/redis.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  async ready(@Res({ passthrough: true }) response: Response) {
    const checks: Record<
      string,
      { status: 'ok' | 'skipped' | 'error'; message?: string }
    > = {};

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = { status: 'ok' };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      checks.database = { status: 'error', message };
    }

    const redisEnabled =
      this.configService.get<boolean>('runtime.redisEnabled') ?? false;
    if (!redisEnabled) {
      checks.redis = { status: 'skipped', message: 'Redis disabled' };
    } else {
      checks.redis = (await this.redisService.ping())
        ? { status: 'ok' }
        : { status: 'error', message: 'Redis ping failed' };
    }

    const ready = Object.values(checks).every(
      (check) => check.status !== 'error',
    );
    if (!ready) {
      response.status(HttpStatus.SERVICE_UNAVAILABLE);
    }

    return {
      status: ready ? 'ready' : 'not_ready',
      profile: this.configService.get<string>('runtime.profile'),
      queueMode: this.configService.get<string>('runtime.queueMode'),
      workerEnabled: this.configService.get<boolean>('runtime.workerEnabled'),
      cronEnabled: this.configService.get<boolean>('runtime.cronEnabled'),
      checks,
      timestamp: new Date().toISOString(),
    };
  }
}
