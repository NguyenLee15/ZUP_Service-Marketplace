import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client?: Redis;
  private readonly logger = new Logger('RedisService');
  private readonly enabled: boolean;

  constructor(private configService: ConfigService) {
    this.enabled = this.configService.get<boolean>('redis.enabled') ?? false;
    if (!this.enabled) {
      this.logger.log('Redis disabled by runtime config');
      return;
    }

    const redisUrl = this.configService.get<string>('redis.url');
    if (redisUrl) {
      this.client = new Redis(redisUrl);
    } else {
      this.client = new Redis({
        host: this.configService.get<string>('redis.host', 'localhost'),
        port: this.configService.get<number>('redis.port', 6379),
        password: this.configService.get<string>('redis.password'),
      });
    }

    this.client.on('connect', () => this.logger.log('Redis connected'));
    this.client.on('error', (err) => this.logger.error('Redis error', err));
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }

  isEnabled(): boolean {
    return this.enabled && !!this.client;
  }

  async ping(): Promise<boolean> {
    if (!this.client) return false;
    try {
      return (await this.client.ping()) === 'PONG';
    } catch (error) {
      this.logger.warn(`Redis ping failed: ${error.message}`);
      return false;
    }
  }

  /** SET key với TTL (giây) */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.client) return;
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  /** GET key */
  async get(key: string): Promise<string | null> {
    if (!this.client) return null;
    return this.client.get(key);
  }

  /** DEL key */
  async del(key: string): Promise<void> {
    if (!this.client) return;
    await this.client.del(key);
  }

  /** INCR key — tăng counter (brute-force, rate-limit) */
  async incr(key: string): Promise<number> {
    if (!this.client) return 1;
    return this.client.incr(key);
  }

  /** SET key chỉ khi chưa tồn tại + TTL */
  async setNx(
    key: string,
    value: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    if (!this.client) return false;
    const result = await this.client.set(key, value, 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  }

  /** Kiểm tra key tồn tại */
  async exists(key: string): Promise<boolean> {
    if (!this.client) return false;
    const result = await this.client.exists(key);
    return result === 1;
  }

  /** Đặt TTL cho key đã tồn tại */
  async expire(key: string, ttlSeconds: number): Promise<void> {
    if (!this.client) return;
    await this.client.expire(key, ttlSeconds);
  }

  /** Lấy TTL còn lại của key */
  async ttl(key: string): Promise<number> {
    if (!this.client) return -2;
    return this.client.ttl(key);
  }
}
