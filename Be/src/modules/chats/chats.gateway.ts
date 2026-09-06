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
import { ChatsService } from './chats.service';
import { SenderType, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { JobName, JobsService } from '../../shared/jobs/jobs.service';
import { resolveWebsocketCorsOrigin } from '../../config/websocket-cors.config';

import { OnEvent } from '@nestjs/event-emitter';
import { ErrorCodes } from '../../common/errors/error-codes';
import {
  extractSocketToken,
  isJwtTokenPayload,
  toAuthenticatedUser,
} from '../../common/types/auth.types';
import type { AuthenticatedSocket } from '../../common/types/auth.types';

interface ConversationEventPayload {
  conversationId: number;
}

@WebSocketGateway({
  cors: { origin: resolveWebsocketCorsOrigin(), credentials: true },
  namespace: '/chat',
})
export class ChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger('ChatsGateway');
  private connectedUsers = new Map<number, string>(); // userId → socketId

  constructor(
    private chatsService: ChatsService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private jobsService: JobsService,
  ) {}

  @OnEvent('ai.message.created')
  handleAiMessage(message: ConversationEventPayload) {
    this.server
      .to(`convo:${message.conversationId}`)
      .emit('newMessage', message);
  }

  @OnEvent('chat.message.recalled')
  handleMessageRecalled(message: ConversationEventPayload) {
    this.server
      .to(`convo:${message.conversationId}`)
      .emit('messageRecalled', message);
  }

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

      const user = toAuthenticatedUser(payload);
      client.data.user = user;
      this.connectedUsers.set(user.id, client.id);
      await client.join(`user:${user.id}`);
      this.logger.log(`User ${user.id} connected`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const user = client.data.user;
    if (user) {
      this.connectedUsers.delete(user.id);
      this.logger.log(`User ${user.id} disconnected`);
    }
  }

  @SubscribeMessage('joinConversation')
  async handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: number },
  ) {
    const userId = client.data.user?.id;
    if (!userId) return;

    const isMember = await this.chatsService.isMember(
      data.conversationId,
      userId,
    );
    if (!isMember) return;

    await client.join(`convo:${data.conversationId}`);
    await this.chatsService.markAsRead(data.conversationId, userId);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: number; content: string; messageType?: string; imageUrl?: string },
  ) {
    const user = client.data.user;
    if (!user) return;

    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id, status: 'ACTIVE' },
      select: { id: true },
    });
    if (!dbUser) {
      client.emit('error', {
        code: ErrorCodes.ACCOUNT_LOCKED,
        message: 'Tài khoản của bạn đã bị khóa',
      });
      return;
    }

    const isMember = await this.chatsService.isMember(
      data.conversationId,
      user.id,
    );
    if (!isMember) return;

    // Nếu role là ADMIN/STAFF thì có thể có logic khác, nhưng ở đây chủ yếu là CUSTOMER/PROVIDER
    const senderType =
      user.role === UserRole.PROVIDER
        ? SenderType.PROVIDER
        : SenderType.CUSTOMER;

    const message = await this.chatsService.createMessage(
      data.conversationId,
      user.id,
      senderType,
      data.content,
      data.messageType,
      data.imageUrl,
    );

    this.server.to(`convo:${data.conversationId}`).emit('newMessage', message);

    // AI Fallback if recipient is offline
    const convo = await this.prisma.conversation.findUnique({
      where: { id: data.conversationId },
    });

    if (convo) {
      const recipientId =
        user.id === convo.customerId ? convo.providerId : convo.customerId;

      // Nếu recipient là Provider và offline -> Trigger AI
      if (recipientId === convo.providerId && !this.isUserOnline(recipientId)) {
        await this.jobsService.enqueue(JobName.ChatAiReply, {
          conversationId: data.conversationId,
          customerId: convo.customerId,
          providerId: convo.providerId,
          lastMessage: data.content,
        });
      }
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: number },
  ) {
    const userId = client.data.user?.id;
    if (!userId) return;

    const isMember = await this.chatsService.isMember(
      data.conversationId,
      userId,
    );
    if (!isMember) return;

    client.to(`convo:${data.conversationId}`).emit('typing', {
      userId,
    });
  }

  @SubscribeMessage('revokeMessage')
  async handleRevokeMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: number },
  ) {
    const userId = client.data.user?.id;
    if (!userId || !Number.isInteger(Number(data.messageId))) return;

    try {
      await this.chatsService.recallMessage(Number(data.messageId), userId);
    } catch {
      return;
    }
  }

  isUserOnline(userId: number): boolean {
    return this.connectedUsers.has(userId);
  }
}
