import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserStatus } from '@prisma/client';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { resolveWebsocketCorsOrigin } from '../../config/websocket-cors.config';
import {
  extractSocketToken,
  isJwtTokenPayload,
  toAuthenticatedUser,
} from '../../common/types/auth.types';
import type { AuthenticatedSocket } from '../../common/types/auth.types';

interface NotificationCreatedPayload {
  userId: number;
  notification: unknown;
}

@WebSocketGateway({
  cors: { origin: resolveWebsocketCorsOrigin(), credentials: true },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger('NotificationsGateway');
  private connectedUsers = new Map<number, string>(); // userId → socketId

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
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

      const account = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { status: true },
      });
      if (!account || account.status === UserStatus.LOCKED) {
        client.disconnect(true);
        return;
      }

      const user = toAuthenticatedUser(payload);
      client.data.user = user;
      this.connectedUsers.set(user.id, client.id);

      // Join a room specifically for this user to receive their personal notifications
      await client.join(`user-notifications:${user.id}`);
      this.logger.log(`User ${user.id} connected to notifications`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const user = client.data.user;
    if (user) {
      this.connectedUsers.delete(user.id);
      this.logger.log(`User ${user.id} disconnected from notifications`);
    }
  }

  // Method to emit a notification to a specific user
  sendNotificationToUser(userId: number, notification: unknown) {
    this.server
      .to(`user-notifications:${userId}`)
      .emit('new_notification', notification);
  }

  // Listen to application events
  @OnEvent('notification.created')
  handleNotificationCreated(payload: NotificationCreatedPayload) {
    this.sendNotificationToUser(payload.userId, payload.notification);
  }
}
