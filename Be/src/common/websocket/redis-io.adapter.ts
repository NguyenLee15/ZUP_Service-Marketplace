import { INestApplicationContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import type { Server, ServerOptions } from 'socket.io';

type SocketIoAdapterFactory = ReturnType<typeof createAdapter>;

export class RedisIoAdapter extends IoAdapter {
  private adapterFactory?: SocketIoAdapterFactory;
  private pubClient?: Redis;
  private subClient?: Redis;

  constructor(
    app: INestApplicationContext,
    private readonly configService: ConfigService,
  ) {
    super(app);
  }

  async connectToRedis(): Promise<void> {
    if (!this.configService.get<boolean>('redis.enabled', false)) return;

    const redisUrl = this.configService.get<string>('redis.url');
    this.pubClient = redisUrl
      ? new Redis(redisUrl)
      : new Redis({
          host: this.configService.get<string>('redis.host', 'localhost'),
          port: this.configService.get<number>('redis.port', 6379),
          password: this.configService.get<string>('redis.password'),
          tls: this.configService.get('redis.tls'),
        });
    this.subClient = this.pubClient.duplicate();

    try {
      await Promise.all([this.pubClient.ping(), this.subClient.ping()]);
      this.adapterFactory = createAdapter(this.pubClient, this.subClient);
    } catch (error) {
      await this.close();
      throw error;
    }
  }

  createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, options) as Server;
    if (this.adapterFactory) server.adapter(this.adapterFactory);
    return server;
  }

  isRedisAdapterEnabled(): boolean {
    return Boolean(this.adapterFactory);
  }

  async close(): Promise<void> {
    this.adapterFactory = undefined;
    await Promise.all(
      [this.pubClient, this.subClient]
        .filter((client): client is Redis => Boolean(client))
        .map((client) => client.quit()),
    );
    this.pubClient = undefined;
    this.subClient = undefined;
  }
}
