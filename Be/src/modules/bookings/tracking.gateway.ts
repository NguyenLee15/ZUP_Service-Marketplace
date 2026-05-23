import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../shared/redis/redis.service';
import { resolveWebsocketCorsOrigin } from '../../config/websocket-cors.config';
import { BookingStatus } from '@prisma/client';
import { OnEvent } from '@nestjs/event-emitter';

// ---- Constants ----
const LOCATION_TTL_SECONDS = 300; // 5 minutes
const MIN_UPDATE_INTERVAL_MS = 2000; // Rate-limit: 2s between updates
const REDIS_KEY_PREFIX = 'tracking:';
const TRACKABLE_STATUSES: BookingStatus[] = [
  BookingStatus.CONFIRMED,
  BookingStatus.IN_PROGRESS,
];

interface LocationPayload {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  updatedAt: string;
}

// ---- In-memory fallback when Redis is disabled ----
const memoryStore = new Map<string, LocationPayload>();

@WebSocketGateway({
  cors: { origin: resolveWebsocketCorsOrigin(), credentials: true },
  namespace: '/tracking',
})
export class TrackingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger('TrackingGateway');
  private lastUpdateTime = new Map<number, number>(); // bookingId → timestamp

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  // ========== Connection Lifecycle ==========

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = this.jwtService.verify(token);
      (client as any).userId = payload.sub;
      (client as any).role = payload.role;
      this.logger.log(
        `[Tracking] User ${payload.sub} (${payload.role}) connected`,
      );
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = (client as any).userId;
    if (userId) {
      this.logger.log(`[Tracking] User ${userId} disconnected`);
    }
  }

  // ========== Provider: Update Location ==========

  @SubscribeMessage('updateLocation')
  async handleUpdateLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      bookingId: number;
      lat: number;
      lng: number;
      heading?: number;
      speed?: number;
    },
  ) {
    const userId = (client as any).userId;
    const role = (client as any).role;

    // Guard: Only providers can update location
    if (role !== 'PROVIDER') return;

    // Guard: Basic validation
    if (
      !data.bookingId ||
      typeof data.lat !== 'number' ||
      typeof data.lng !== 'number'
    )
      return;

    // Rate-limit: Ignore if < 2s since last update for this booking
    const now = Date.now();
    const lastUpdate = this.lastUpdateTime.get(data.bookingId) || 0;
    if (now - lastUpdate < MIN_UPDATE_INTERVAL_MS) return;

    // Guard: Verify provider owns this booking & status is trackable
    const booking = await this.prisma.booking.findFirst({
      where: {
        id: data.bookingId,
        providerId: userId,
        status: { in: TRACKABLE_STATUSES },
      },
      select: { id: true, customerId: true },
    });

    if (!booking) return;

    // Store location
    const locationPayload: LocationPayload = {
      lat: data.lat,
      lng: data.lng,
      heading: data.heading ?? 0,
      speed: data.speed ?? 0,
      updatedAt: new Date().toISOString(),
    };

    const redisKey = `${REDIS_KEY_PREFIX}${data.bookingId}`;

    if (this.redis.isEnabled()) {
      await this.redis.setJson(redisKey, locationPayload, LOCATION_TTL_SECONDS);
    } else {
      memoryStore.set(redisKey, locationPayload);
    }

    this.lastUpdateTime.set(data.bookingId, now);

    // Emit to customer room
    this.server.to(`track:${data.bookingId}`).emit('providerLocation', {
      bookingId: data.bookingId,
      ...locationPayload,
    });
  }

  // ========== Customer: Subscribe to Tracking ==========

  @SubscribeMessage('subscribeTracking')
  async handleSubscribeTracking(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { bookingId: number },
  ) {
    const userId = (client as any).userId;

    if (!data.bookingId) return;

    // Guard: Verify customer owns this booking
    const booking = await this.prisma.booking.findFirst({
      where: {
        id: data.bookingId,
        customerId: userId,
        status: { in: TRACKABLE_STATUSES },
      },
      select: { id: true },
    });

    if (!booking) return;

    // Join tracking room
    client.join(`track:${data.bookingId}`);
    this.logger.log(
      `[Tracking] Customer ${userId} subscribed to booking ${data.bookingId}`,
    );

    // Send last known location if available
    const redisKey = `${REDIS_KEY_PREFIX}${data.bookingId}`;
    let lastLocation: LocationPayload | null = null;

    if (this.redis.isEnabled()) {
      lastLocation = await this.redis.getJson<LocationPayload>(redisKey);
    } else {
      lastLocation = memoryStore.get(redisKey) || null;
    }

    client.emit('lastKnownLocation', {
      bookingId: data.bookingId,
      location: lastLocation,
    });
  }

  // ========== Customer: Unsubscribe from Tracking ==========

  @SubscribeMessage('unsubscribeTracking')
  async handleUnsubscribeTracking(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { bookingId: number },
  ) {
    if (!data.bookingId) return;
    client.leave(`track:${data.bookingId}`);
    this.logger.log(
      `[Tracking] User ${(client as any).userId} unsubscribed from booking ${data.bookingId}`,
    );
  }

  // ========== Event: Booking Status Changed ==========
  // Cleanup tracking when booking leaves trackable state

  @OnEvent('booking.status.changed')
  async handleBookingStatusChanged(payload: {
    bookingId: number;
    fromStatus: string;
    toStatus: string;
  }) {
    const trackableSet = new Set(TRACKABLE_STATUSES as string[]);

    // If booking left a trackable status
    if (
      trackableSet.has(payload.fromStatus) &&
      !trackableSet.has(payload.toStatus)
    ) {
      // Notify subscribers that tracking has ended
      this.server.to(`track:${payload.bookingId}`).emit('trackingEnded', {
        bookingId: payload.bookingId,
        reason: payload.toStatus,
      });

      // Cleanup Redis
      const redisKey = `${REDIS_KEY_PREFIX}${payload.bookingId}`;
      if (this.redis.isEnabled()) {
        await this.redis.del(redisKey);
      } else {
        memoryStore.delete(redisKey);
      }

      this.lastUpdateTime.delete(payload.bookingId);
      this.logger.log(
        `[Tracking] Booking ${payload.bookingId} tracking ended (${payload.toStatus})`,
      );
    }
  }
}
