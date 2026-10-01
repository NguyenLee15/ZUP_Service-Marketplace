import { INestApplicationContext, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { Adapter } from 'socket.io-adapter';
import type { Server, ServerOptions } from 'socket.io';

type SocketIoAdapterFactory = ReturnType<typeof createAdapter>;

export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private adapterFactory?: SocketIoAdapterFactory;
  private pubClient?: Redis;
  private subClient?: Redis;
  private readonly servers = new Set<Server>();
  private degraded = false;
  private closed = false;
  private degrading = false;

  constructor(
    app: INestApplicationContext,
    private readonly configService: ConfigService,
  ) {
    super(app);
  }

  async connectToRedis(): Promise<void> {
    if (!this.configService.get<boolean>('redis.enabled', false)) return;

    this.closed = false;
    this.degraded = false;
    const redisUrl = this.configService.get<string>('redis.url');
    const redisOptions = {
      connectTimeout: 5000,
      maxRetriesPerRequest: 3,
    };
    this.pubClient = redisUrl
      ? new Redis(redisUrl, redisOptions)
      : new Redis({
          host: this.configService.get<string>('redis.host', 'localhost'),
          port: this.configService.get<number>('redis.port', 6379),
          password: this.configService.get<string>('redis.password'),
          tls: this.configService.get('redis.tls'),
          ...redisOptions,
        });
    this.subClient = this.pubClient.duplicate();
    this.attachRedisErrorHandler(this.pubClient, 'pub');
    this.attachRedisErrorHandler(this.subClient, 'sub');

    try {
      await Promise.all([this.pubClient.ping(), this.subClient.ping()]);
      const adapterFactory = createAdapter(this.pubClient, this.subClient);
      if (this.degraded || this.closed) {
        await this.closeRedisClients();
        return;
      }
      this.adapterFactory = adapterFactory;
    } catch (error) {
      this.logger.warn(
        `Redis Socket.IO adapter unavailable at startup; using in-memory adapter (${this.errorCode(error)})`,
      );
      this.degraded = true;
      this.adapterFactory = undefined;
      await this.closeRedisClients();
    }
  }

  createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, options) as Server;
    this.servers.add(server);
    if (this.adapterFactory) server.adapter(this.adapterFactory);
    return server;
  }

  isRedisAdapterEnabled(): boolean {
    return Boolean(this.adapterFactory);
  }

  isDegraded(): boolean {
    return this.degraded;
  }

  async close(): Promise<void> {
    this.closed = true;
    this.adapterFactory = undefined;
    await this.closeRedisClients();
    this.servers.clear();
  }

  private attachRedisErrorHandler(client: Redis, role: 'pub' | 'sub'): void {
    client.on('error', () => {
      this.logger.error(`Redis Socket.IO ${role} client emitted an error`);
      void this.degradeToInMemory();
    });
  }

  private async degradeToInMemory(): Promise<void> {
    if (this.closed || this.degraded || this.degrading) return;

    this.degrading = true;
    this.degraded = true;
    this.adapterFactory = undefined;

    for (const server of this.servers) {
      this.switchServerToInMemory(server);
    }

    await this.closeRedisClients();
    this.degrading = false;
    this.logger.warn('Redis Socket.IO adapter degraded to in-memory mode');
  }

  private switchServerToInMemory(server: Server): void {
    const roomMemberships = Array.from(server._nsps.values()).flatMap(
      (namespace) =>
        Array.from(namespace.sockets.values()).map((socket) => ({
          socket,
          rooms: Array.from(socket.rooms).filter((room) => room !== socket.id),
        })),
    );

    server.adapter(Adapter);

    for (const { socket, rooms } of roomMemberships) {
      if (rooms.length === 0) continue;
      void Promise.resolve(socket.join(rooms)).catch(() => {
        this.logger.warn(
          `Unable to restore Socket.IO rooms for socket ${socket.id} after Redis degradation`,
        );
      });
    }
  }

  private async closeRedisClients(): Promise<void> {
    const clients = [this.pubClient, this.subClient].filter(
      (client): client is Redis => Boolean(client),
    );
    this.pubClient = undefined;
    this.subClient = undefined;

    await Promise.allSettled(
      clients.map(async (client) => {
        try {
          await Promise.race([
            client.quit(),
            new Promise<void>((resolve) => setTimeout(resolve, 1000)),
          ]);
        } finally {
          client.disconnect();
        }
      }),
    );
  }

  private errorCode(error: unknown): string {
    return error instanceof Error ? error.name : 'UnknownError';
  }
}
