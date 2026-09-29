import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../shared/redis/redis.service';
import { resolveWebsocketCorsOrigin } from '../../config/websocket-cors.config';
import { BookingStatus } from '@prisma/client';
import { OnEvent } from '@nestjs/event-emitter';
import {
  extractSocketToken,
  isJwtTokenPayload,
  toAuthenticatedUser,
} from '../../common/types/auth.types';
import type { AuthenticatedSocket } from '../../common/types/auth.types';
import {
  createTrackingLocationStore,
  TrackingLocationStore,
} from './tracking-location.store';

// ---- Constants ----
const LOCATION_TTL_SECONDS = 300; // 5 minutes
const MIN_UPDATE_INTERVAL_MS = 2000; // Rate-limit: 2s between updates
const TRACKABLE_STATUSES: BookingStatus[] = [
  BookingStatus.CONFIRMED,
  BookingStatus.IN_PROGRESS,
];

interface LocationPayload {
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  updatedAt: string;
}

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
  private readonly locationStore: TrackingLocationStore;

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private redis: RedisService,
  ) {
    this.locationStore = createTrackingLocationStore(redis);
  }

  // ========== Connection Lifecycle ==========

  handleConnection(client: AuthenticatedSocket) {
    try {
      const token = extractSocketToken(client);
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = this.jwtService.verify<Record<string, unknown>>(token);
      if (!isJwtTokenPayload(payload)) {
        client.disconnect();
        return;
      }

      const user = toAuthenticatedUser(payload);
      client.data.user = user;
      this.logger.log(`[Tracking] User ${user.id} (${user.role}) connected`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const user = client.data.user;
    if (user) {
      this.logger.log(`[Tracking] User ${user.id} disconnected`);
    }
  }

  // ========== Provider: Update Location ==========

  @SubscribeMessage('updateLocation')
  async handleUpdateLocation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: {
      bookingId: number;
      lat: number;
      lng: number;
      heading?: number;
      speed?: number;
    },
  ) {
    const user = client.data.user;
    if (!user) return;

    // Guard: Only providers can update location
    if (user.role !== 'PROVIDER') return;

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
        providerId: user.id,
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

    await this.locationStore.set(
      data.bookingId,
      locationPayload,
      LOCATION_TTL_SECONDS,
    );

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
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { bookingId: number },
  ) {
    const userId = client.data.user?.id;
    if (!userId) return;

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
    await client.join(`track:${data.bookingId}`);
    this.logger.log(
      `[Tracking] Customer ${userId} subscribed to booking ${data.bookingId}`,
    );

    // Send last known location if available
    const lastLocation = await this.locationStore.get(data.bookingId);

    client.emit('lastKnownLocation', {
      bookingId: data.bookingId,
      location: lastLocation,
    });
  }

  // ========== Customer: Unsubscribe from Tracking ==========

  @SubscribeMessage('unsubscribeTracking')
  handleUnsubscribeTracking(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { bookingId: number },
  ) {
    if (!data.bookingId) return;
    void client.leave(`track:${data.bookingId}`);
    this.logger.log(
      `[Tracking] User ${client.data.user?.id ?? 'unknown'} unsubscribed from booking ${data.bookingId}`,
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
      await this.locationStore.delete(payload.bookingId);

      this.lastUpdateTime.delete(payload.bookingId);
      this.logger.log(
        `[Tracking] Booking ${payload.bookingId} tracking ended (${payload.toStatus})`,
      );
    }
  }
}
