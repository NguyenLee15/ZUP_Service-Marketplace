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
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Redis ping failed: ${message}`);
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

  /** DEL by pattern */
  async delByPattern(pattern: string): Promise<void> {
    if (!this.client) return;
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (_e) {
      this.logger.warn(`Failed to delete keys by pattern ${pattern}`);
    }
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

  /** Store JSON object with TTL */
  async setJson(key: string, value: object, ttlSeconds: number): Promise<void> {
    if (!this.client) return;
    await this.client.setex(key, ttlSeconds, JSON.stringify(value));
  }

  /** Get JSON object */
  async getJson<T = unknown>(key: string): Promise<T | null> {
    if (!this.client) return null;
    const raw = await this.client.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }
}
