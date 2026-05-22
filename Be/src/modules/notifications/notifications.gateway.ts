import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OnEvent } from '@nestjs/event-emitter';
import { resolveWebsocketCorsOrigin } from '../../config/websocket-cors.config';

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

  constructor(private jwtService: JwtService) {}

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
      this.connectedUsers.set(payload.sub, client.id);

      // Join a room specifically for this user to receive their personal notifications
      client.join(`user-notifications:${payload.sub}`);
      this.logger.log(`User ${payload.sub} connected to notifications`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = (client as any).userId;
    if (userId) {
      this.connectedUsers.delete(userId);
      this.logger.log(`User ${userId} disconnected from notifications`);
    }
  }

  // Method to emit a notification to a specific user
  sendNotificationToUser(userId: number, notification: any) {
    this.server
      .to(`user-notifications:${userId}`)
      .emit('new_notification', notification);
  }

  // Listen to application events
  @OnEvent('notification.created')
  handleNotificationCreated(payload: { userId: number; notification: any }) {
    this.sendNotificationToUser(payload.userId, payload.notification);
  }
}
